import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import { sdk } from "./_core/sdk";
import type { Request, Response } from "express";
import { notifyDriversOfNewOrder, sendOneSignalNotification } from "./notifications";
import { calculateOrderPrice, getCommissionPerOrder, shouldBlockDriver } from "../shared/pricing";
import { updateChatRoomParticipants } from "./_core/chat";

export const appRouter = router({
  system: systemRouter,

  /**
   * Authentication routes
   */
  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      const user = await db.getUserById(opts.ctx.user.id);
      if (!user) return null;
      return {
        ...opts.ctx.user,
        avatarUrl: user.avatarUrl,
      };
    }),
    
    // Register new user
    register: publicProcedure
      .input(
        z.object({
          phone: z.string().min(10, "رقم الهاتف غير صحيح"),
          password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
          name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
          email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
          role: z.enum(["customer", "driver", "admin"]).default("customer"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUser = await db.getUserByPhone(input.phone);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "رقم الهاتف مسجل بالفعل",
          });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(input.password, 10);

        // Create user
        const openId = `phone-${input.phone}`;
        // إذا كان المستخدم سائقاً، يتم تعطيل حسابه تلقائياً حتى يتم تفعيله من الإدارة
        const isActive = input.role !== "driver";
        
        await db.upsertUser({
          openId,
          phone: input.phone,
          password: hashedPassword,
          name: input.name,
          email: input.email,
          role: input.role,
          isActive,
          accountStatus: input.role === "driver" ? "suspended" : "active",
        });

        // Get the created user
        const user = await db.getUserByPhone(input.phone);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إنشاء المستخدم",
          });
        }

        // Send welcome notification
        try {
          const app = (ctx.req as any)?.app;
          if (app?.sendNotificationToUser) {
            await app.sendNotificationToUser(user.id, {
              title: "أهلاً بك في وصلي! 🚗",
              body: `استمتع بخصم 50% على أول طلب باستخدام كود: WASLY50`,
              url: "/",
              tag: "welcome-bonus",
            });
          }
        } catch (error) {
          console.error("[WelcomeNotification] Failed to send:", error);
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
          },
        };
      }),

    // Login with phone and password
    login: publicProcedure
      .input(
        z.object({
          phone: z.string().min(10, "رقم الهاتف غير صحيح"),
          password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Find user by phone
        const user = await db.getUserByPhone(input.phone);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "رقم الهاتف أو كلمة المرور غير صحيحة",
          });
        }

        // Check if user is active
        if (!user.isActive) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "الحساب معطل",
          });
        }

        // Verify password
        if (!user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "رقم الهاتف أو كلمة المرور غير صحيحة",
          });
        }
        const isPasswordValid = await bcryptjs.compare(input.password, user.password);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "رقم الهاتف أو كلمة المرور غير صحيحة",
          });
        }

        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          phone: user.phone || undefined,
          password: user.password || undefined,
          lastSignedIn: new Date(),
        });

        // Send welcome notification
        try {
          const app = (ctx.req as any)?.app;
          if (app?.sendNotificationToUser) {
            await app.sendNotificationToUser(user.id, {
              title: "أهلاً بك في وصلي! 🚗",
              body: `استمتع بخصم 50% على أول طلب باستخدام كود: WASLY50`,
              url: "/",
              tag: "welcome-bonus",
            });
          }
        } catch (error) {
          console.error("[WelcomeNotification] Failed to send:", error);
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
        });

        return {
          success: true,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
          },
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * User management routes
   */
  offers: router({
    // Get active offers for customers
    getActive: publicProcedure.query(async () => {
      return await db.getActiveOffers();
    }),

    // Create a new offer (Admin only)
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          imageUrl: z.string(),
          link: z.string().optional(),
          expiresAt: z.string(), // ISO string
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        let finalImageUrl = input.imageUrl;

        // If the imageUrl is a Base64 string, automatically convert it to a local file
        if (input.imageUrl.startsWith("data:image/")) {
          try {
            const { storagePut } = await import("./storage");
            const contentType = input.imageUrl.split(";")[0].split(":")[1];
            const extension = contentType.split("/")[1] || "png";
            const fileName = `offers/auto-${Date.now()}.${extension}`;
            
            console.log(`[AutoUpload] Converting Base64 to local file: ${fileName}`);
            const { url } = await storagePut(fileName, input.imageUrl, contentType);
            finalImageUrl = url;
            console.log(`[AutoUpload] Success: ${finalImageUrl}`);
          } catch (error) {
            console.error("[AutoUpload] Failed to convert Base64, using original string:", error);
          }
        }

        return await db.createOffer({
          ...input,
          imageUrl: finalImageUrl,
          expiresAt: new Date(input.expiresAt),
        });
      }),

    // Delete an offer (Admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.deleteOffer(input.id);
      }),

    // Upload offer image (Admin only)
    uploadImage: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        console.log(`[OfferUpload] Starting upload for user ${ctx.user.id}, content type: ${input.contentType}, base64 length: ${input.base64.length}`);
        try {
          const { storagePut } = await import("./storage");
          const buffer = Buffer.from(input.base64, "base64");
          const fileName = `offers/${Date.now()}.${input.contentType.split("/")[1]}`;
          console.log(`[OfferUpload] Calling storagePut for ${fileName}, size: ${buffer.length} bytes`);
          const { url } = await storagePut(fileName, buffer, input.contentType);
          console.log(`[OfferUpload] Upload successful, URL: ${url.substring(0, 50)}...`);
          return { success: true, url };
        } catch (error: any) {
          console.error(`[OfferUpload] CRITICAL ERROR:`, error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `فشل رفع الصورة: ${error.message || "خطأ غير معروف"}`,
          });
        }
      }),
  }),

  coupons: router({
    validate: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const coupon = await db.getCouponByCode(input.code);
        if (!coupon || !coupon.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "كود الخصم غير صحيح أو منتهي الصلاحية" });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "كود الخصم منتهي الصلاحية" });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "تم الوصول للحد الأقصى لاستخدام الكود" });
        }

        const hasUsed = await db.hasUserUsedCoupon(ctx.user.id, coupon.id);
        if (hasUsed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "لقد استخدمت هذا الكود من قبل" });
        }

        if (coupon.isFirstOrderOnly) {
          const userOrders = await db.getOrdersByCustomerId(ctx.user.id);
          if (userOrders.length > 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "هذا الكود مخصص للطلب الأول فقط" });
          }
        }

        return {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: parseFloat(coupon.discountValue.toString()),
          maxDiscount: coupon.maxDiscount ? parseFloat(coupon.maxDiscount.toString()) : null,
          minOrderValue: coupon.minOrderValue ? parseFloat(coupon.minOrderValue.toString()) : 0,
        };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await db.getAllCoupons();
    }),

    create: protectedProcedure
      .input(z.object({
        code: z.string(),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number(),
        maxDiscount: z.number().optional(),
        minOrderValue: z.number().optional(),
        expiresAt: z.string().optional(),
        usageLimit: z.number().optional(),
        isFirstOrderOnly: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.createCoupon({
          ...input,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        });
      }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.updateCouponStatus(input.id, input.isActive);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.deleteCoupon(input.id);
      }),
  }),


  users: router({
    // Get current user
    getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        latitude: user.latitude ? parseFloat(user.latitude.toString()) : null,
        longitude: user.longitude ? parseFloat(user.longitude.toString()) : null,
      };
    }),

    // Update user profile
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).optional().or(z.literal("")),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().min(10).optional().or(z.literal("")),
          avatarUrl: z.string().optional().or(z.literal("")),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updatedUser = await db.updateUserProfile(ctx.user.id, input);
        if (!updatedUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return {
          success: true,
          user: {
            id: updatedUser.id,
            phone: updatedUser.phone,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
          },
        };
      }),

    // Upload avatar
    uploadAvatar: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        console.log(`[Upload] Starting avatar upload for user ${ctx.user.id}`);
        try {
          const { storagePut } = await import("./storage");
          const buffer = Buffer.from(input.base64, "base64");
          const fileName = `avatars/${ctx.user.id}-${Date.now()}.${input.contentType.split("/")[1]}`;
          
          console.log(`[Upload] File name: ${fileName}, Content type: ${input.contentType}, Size: ${buffer.length} bytes`);
          
          const { url } = await storagePut(fileName, buffer, input.contentType);
          console.log(`[Upload] Storage upload successful, URL: ${url}`);
          
          await db.updateUserProfile(ctx.user.id, { avatarUrl: url });
          console.log(`[Upload] Database update successful for user ${ctx.user.id}`);
          
          return { success: true, url };
        } catch (error: any) {
          console.error(`[Upload] FAILED for user ${ctx.user.id}:`, error.message || error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `فشل رفع الصورة: ${error.message || "خطأ غير معروف"}`,
          });
        }
      }),

    // Get all users (Admin only)
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const users = await db.getAllUsers();
      return users.map((u) => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        accountStatus: u.accountStatus,
        pendingCommission: u.pendingCommission ? parseFloat(u.pendingCommission.toString()) : 0,
        createdAt: u.createdAt,
      }));
    }),

    // Update user location
    updateLocation: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserLocation(ctx.user.id, input.latitude, input.longitude);

        // If driver, also update driver availability
        if (ctx.user.role === "driver") {
          await db.updateDriverLocation(ctx.user.id, input.latitude, input.longitude);
        }

        return { success: true };
      }),

    // Get all drivers
    getAllDrivers: publicProcedure.query(async () => {
      const drivers = await db.getAllDrivers();
      return drivers.map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        isActive: d.isActive,
      }));
    }),
    
    // Get specific user by ID
    getUser: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          latitude: user.latitude ? parseFloat(user.latitude.toString()) : null,
          longitude: user.longitude ? parseFloat(user.longitude.toString()) : null,
        };
      }),
  }),

  /**
   * Order management routes
   */
  orders: router({
    // Create new order
    /**
     * Create Restaurant Order - Automatically creates a delivery order from restaurant to customer
     */
    createRestaurantOrder: protectedProcedure
      .input(
        z.object({
          restaurantId: z.number(),
          items: z.array(
            z.object({
              menuItemId: z.number(),
              quantity: z.number(),
              price: z.number(),
            })
          ),
          totalPrice: z.number(),
          notes: z.string().optional(),
          pickupLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }).optional(),
          deliveryLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }),
          couponId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "customer") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only customers can create restaurant orders",
          });
        }

        // Restaurant pickup location (Default to Roll We if not provided)
        const pickupLocation = input.pickupLocation || {
          address: "رول وي - مطعم وكافيه، العبور الجديدة",
          latitude: 30.2750994,
          longitude: 31.5006526,
          neighborhood: "العبور الجديدة",
        };

        let restaurantName = "رول وي";
        if (input.restaurantId === 2) {
          restaurantName = "كشري الخديوي";
        } else if (input.restaurantId === 3) {
          restaurantName = "مطعم الحوت";
        } else if (input.pickupLocation?.address) {
          // If address is provided in pickupLocation, use it as restaurant name if it contains specific keywords
          // or just use the provided address
          restaurantName = input.pickupLocation.address.split(',')[0].split('-')[0].trim();
        }

        // Calculate distance
        const distance = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          input.deliveryLocation.latitude,
          input.deliveryLocation.longitude
        );

        // Estimate time
        const estimatedTime = Math.round(distance * 5 + 5);

        // Calculate delivery price based on distance (using existing pricing logic)
        const deliveryPrice = calculateOrderPrice(
          pickupLocation.neighborhood || "",
          input.deliveryLocation.neighborhood,
          distance
        );

        // Create delivery order in database
        const result = await db.createOrder({
          customerId: ctx.user.id,
          pickupLocation,
          deliveryLocation: input.deliveryLocation,
          price: deliveryPrice, // This is the delivery fee for the driver
          distance,
          estimatedTime,
          notes: `المطعم: ${restaurantName}\nالعنوان: ${input.deliveryLocation.address}\nالملاحظات: ${input.notes || "بدون ملاحظات"}\nقيمة الطعام: ج.م ${input.totalPrice}`,
          couponId: input.couponId,
        });

	        // Notify drivers about new order
	        await notifyDriversOfNewOrder(
	          result.id,
	          `طلب توصيل جديد من مطعم ${restaurantName}. سعر التوصيل: ج.م ${deliveryPrice}. اضغط للتفاصيل وقبول الطلب! 🍽️`
	        );

	        // Send WhatsApp notification to owner (01557564373)
	        try {
	          const ownerPhone = "201557564373";
	          const customer = await db.getUserById(ctx.user.id);
	          const customerName = customer?.name || "عميل";
	          const customerPhone = customer?.phone || "غير معروف";
	          const apikey = process.env.CALLMEBOT_API_KEY;
	          
	          if (apikey) {
	            const message = `*طلب مطعم جديد من تطبيق وصلي* 🍽️\n\n` +
	              `*المطعم:* ${restaurantName}\n` +
	              `*رقم الطلب:* #${result.id}\n` +
	              `*العميل:* ${customerName}\n` +
	              `*رقم الهاتف:* ${customerPhone}\n` +
	              `*العنوان:* ${input.deliveryLocation.address}\n` +
	              `*قيمة الطعام:* ${input.totalPrice} ج.م\n` +
	              `*سعر التوصيل:* ${deliveryPrice} ج.م\n` +
	              `*ملاحظات:* ${input.notes || "لا يوجد"}`;
	            
	            const url = `https://api.callmebot.com/whatsapp.php?phone=${ownerPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
	            axios.get(url).catch(e => console.error("[WhatsApp] Error:", e.message));
	          }
	        } catch (waError) {
	          console.error("[WhatsApp] Failed to send notification:", waError);
	        }
	
	        return {
	          success: true,
	          orderId: result.id,
	          price: input.totalPrice,
	          distance,
	          estimatedTime,
	        };
	      }),

    createOrder: protectedProcedure
      .input(
        z.object({
          pickupLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }),
          deliveryLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }),
          price: z.number().optional(),
          notes: z.string().optional(),
          couponId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "customer") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only customers can create orders",
          });
        }

        // Calculate distance (simplified - using Haversine formula)
        const distance = calculateDistance(
          input.pickupLocation.latitude,
          input.pickupLocation.longitude,
          input.deliveryLocation.latitude,
          input.deliveryLocation.longitude
        );

        // Estimate time (5 minutes per km + 5 minutes base)
        const estimatedTime = Math.round(distance * 5 + 5);

        // Use price from frontend if provided, otherwise calculate it
        let calculatedPrice = input.price;
        if (!calculatedPrice) {
          calculatedPrice = calculateOrderPrice(
            input.pickupLocation.neighborhood || "",
            input.deliveryLocation.neighborhood,
            distance
          );
        }

        // Create order in database
        const result = await db.createOrder({
          customerId: ctx.user.id,
          pickupLocation: input.pickupLocation,
          deliveryLocation: input.deliveryLocation,
          price: calculatedPrice,
          distance,
          estimatedTime,
          notes: input.notes,
          couponId: input.couponId,
        });

	        // Notify drivers about new order
	        await notifyDriversOfNewOrder(result.id, `يوجد طلب جديد متاح الآن بقيمة ج.م ${calculatedPrice}. اضغط للتفاصيل وقبول الطلب! 🚀`);
	
	        // Send WhatsApp notification to owner (01557564373)
	        try {
	          const ownerPhone = "201557564373";
	          const customer = await db.getUserById(ctx.user.id);
	          const customerName = customer?.name || "عميل";
	          const customerPhone = customer?.phone || "غير معروف";
	          const apikey = process.env.CALLMEBOT_API_KEY;
	          
	          if (apikey) {
	            const message = `*طلب توصيل جديد من تطبيق وصلي* 🚀\n\n` +
	              `*رقم الطلب:* #${result.id}\n` +
	              `*العميل:* ${customerName}\n` +
	              `*رقم الهاتف:* ${customerPhone}\n` +
	              `*من:* ${input.pickupLocation.address}\n` +
	              `*إلى:* ${input.deliveryLocation.address}\n` +
	              `*التكلفة:* ${calculatedPrice} ج.م\n` +
	              `*المسافة:* ${distance.toFixed(1)} كم\n` +
	              `*ملاحظات:* ${input.notes || "لا يوجد"}`;
	            
	            const url = `https://api.callmebot.com/whatsapp.php?phone=${ownerPhone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
	            axios.get(url).catch(e => console.error("[WhatsApp] Error:", e.message));
	          }
	        } catch (waError) {
	          console.error("[WhatsApp] Failed to send notification:", waError);
	        }

	        return {
	          success: true,
	          orderId: result.id,
	          price: calculatedPrice,
	          distance,
	          estimatedTime,
	        };
	      }),

       // Get customer orders
    getCustomerOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "customer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only customers can view their orders",
        });
      }

      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithDriver = await Promise.all(
        orders.map(async (o) => {
          let driver = null;
          let driverPhone = null;
          if (o.driverId) {
            driver = await db.getUserById(o.driverId);
            driverPhone = driver?.phone || null;
          }
          return {
            id: o.id,
            status: o.status,
            pickupLocation: o.pickupLocation,
            deliveryLocation: o.deliveryLocation,
            price: o.price ? parseFloat(o.price.toString()) : 0,
            distance: o.distance ? parseFloat(o.distance.toString()) : 0,
            estimatedTime: o.estimatedTime,
            driverId: o.driverId,
            driver: driver ? {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
            } : null,
            driverPhone: driverPhone,
            createdAt: o.createdAt,
          };
        })
      );
      return ordersWithDriver;
    }),

    // Get orders with driver details
    getOrdersWithDriver: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "customer") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only customers can view their orders",
        });
      }

      const orders = await db.getOrdersByCustomerId(ctx.user.id);
      const ordersWithDriver = await Promise.all(
        orders.map(async (o) => {
          let driver = null;
          let driverPhone = null;
          if (o.driverId) {
            driver = await db.getUserById(o.driverId);
            driverPhone = driver?.phone || null;
          }
          return {
            id: o.id,
            status: o.status,
            pickupLocation: o.pickupLocation,
            deliveryLocation: o.deliveryLocation,
            price: o.price ? parseFloat(o.price.toString()) : 0,
            distance: o.distance ? parseFloat(o.distance.toString()) : 0,
            estimatedTime: o.estimatedTime,
            driver: driver ? {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
            } : null,
            driverPhone: driverPhone,
            createdAt: o.createdAt,
          };
        })
      );
      
      return ordersWithDriver;
    }),

    // Get driver orders
    getDriverOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "driver") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only drivers can view their orders",
        });
      }

      const orders = await db.getOrdersByDriverId(ctx.user.id);
      const ordersWithCustomer = await Promise.all(
        orders.map(async (o) => {
          // Get customer details
          const customer = await db.getUserById(o.customerId);
          return {
            id: o.id,
            status: o.status,
            pickupLocation: o.pickupLocation,
            deliveryLocation: o.deliveryLocation,
            price: o.price ? parseFloat(o.price.toString()) : 0,
            distance: o.distance ? parseFloat(o.distance.toString()) : 0,
            estimatedTime: o.estimatedTime,
            customerId: o.customerId,
            customer: customer ? {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
            } : null,
            notes: o.notes,
            createdAt: o.createdAt,
          };
        })
      );
      return ordersWithCustomer;
    }),

    // Get available orders for drivers
    getAvailableOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "driver") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only drivers can view available orders",
        });
      }

      const orders = await db.getAvailableOrders();
      return orders.map((o) => ({
        id: o.id,
        pickupLocation: o.pickupLocation,
        deliveryLocation: o.deliveryLocation,
        price: o.price ? parseFloat(o.price.toString()) : 0,
        distance: o.distance ? parseFloat(o.distance.toString()) : 0,
        estimatedTime: o.estimatedTime,
        createdAt: o.createdAt,
      }));
    }),

    // Cancel order (customer only)
    cancelOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "customer") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only customers can cancel orders",
          });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        if (order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only cancel your own orders",
          });
        }

        if (order.status !== "pending" && order.status !== "assigned") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot cancel order in current status",
          });
        }

        await db.updateOrderStatus(input.orderId, "cancelled");

        // Send notification to driver if assigned
        if (order.driverId) {
          await sendOneSignalNotification({ userId: order.driverId }, {
            title: "تم إلغاء الطلب ❌",
            body: `تم إلغاء الطلب رقم #${order.id} من قبل العميل.`,
            orderId: order.id,
          });
        }

        return { success: true, message: "تم إلغاء الطلب بنجاح" };
      }),

    // Update order status
    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum([
            "pending",
            "assigned",
            "accepted",
            "picked_up",
            "in_transit",
            "arrived",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // If driver is accepting the order, assign it to them first
        if (ctx.user.role === "driver" && input.status === "accepted" && !order.driverId) {
          await db.assignOrderToDriver(input.orderId, ctx.user.id);
          updateChatRoomParticipants(input.orderId, order.customerId, ctx.user.id);
        }

        // Verify permissions
        if (
          ctx.user.role === "driver" &&
          order.driverId !== ctx.user.id &&
          !(input.status === "accepted" && !order.driverId)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own orders",
          });
        }

        if (ctx.user.role === "customer" && order.customerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own orders",
          });
        }

        await db.updateOrderStatus(input.orderId, input.status);

        // Send OneSignal Push Notification to customer about status update
        const statusMap: Record<string, string> = {
          "picked_up": "تم استلام الشحنة",
          "in_transit": "في الطريق إليك",
          "arrived": "وصل الكابتن لموقعك",
          "delivered": "تم التسليم بنجاح",
          "cancelled": "تم الإلغاء",
        };

        if (statusMap[input.status]) {
          await sendOneSignalNotification({ userId: order.customerId }, {
            title: "تحديث حالة الطلب 📦",
            body: `حالة طلبك رقم #${order.id} أصبحت الآن: ${statusMap[input.status]}`,
            orderId: order.id,
            url: `/customer/orders/${order.id}`,
          });
        }

        return { success: true };
      }),

    // Get order details
    getOrderDetails: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Verify permissions
        if (
          ctx.user.role === "customer" &&
          order.customerId !== ctx.user.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own orders",
          });
        }

        if (ctx.user.role === "driver" && order.driverId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view assigned orders",
          });
        }

        // Get driver details if assigned
        let assignedDriver = null;
        if (order.driverId) {
          const driver = await db.getUserById(order.driverId);
          if (driver) {
            assignedDriver = {
              id: driver.id,
              name: driver.name,
              phone: driver.phone,
            };
          }
        }

        return {
          id: order.id,
          status: order.status,
          pickupLocation: order.pickupLocation,
          deliveryLocation: order.deliveryLocation,
          price: order.price ? parseFloat(order.price.toString()) : 0,
          distance: order.distance ? parseFloat(order.distance.toString()) : 0,
          estimatedTime: order.estimatedTime,
          customerId: order.customerId,
          driverId: order.driverId,
          assignedDriver: assignedDriver,
          notes: order.notes,
          rating: order.rating,
          ratingComment: order.ratingComment,
          createdAt: order.createdAt,
          deliveredAt: order.deliveredAt,
        };
      }),

    // Get order with customer details
    getOrderWithCustomer: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Get customer details
        const customer = await db.getUserById(order.customerId);
        if (!customer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }

      return {
        id: order.id,
        status: order.status,
        pickupLocation: order.pickupLocation,
        deliveryLocation: order.deliveryLocation,
        price: order.price ? parseFloat(order.price.toString()) : 0,
        distance: order.distance ? parseFloat(order.distance.toString()) : 0,
        estimatedTime: order.estimatedTime,
        notes: order.notes,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        customerPhone: customer.phone,
        createdAt: order.createdAt,
      };
      }),

    // Accept order by driver (First-come, first-served)
    acceptOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "driver") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only drivers can accept orders",
          });
        }

        // Check if driver account is suspended
        const driver = await db.getUserById(ctx.user.id);
        if (!driver) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
        }

        if (driver.accountStatus !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "حسابك موقوف. يرجى سداد العمولات المستحقة لتفعيل الحساب",
          });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Check if order is still available (not assigned to another driver)
        if (order.driverId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Order has already been accepted by another driver",
          });
        }

        // Assign order to driver
        await db.assignOrderToDriver(input.orderId, ctx.user.id);
        await db.updateOrderStatus(input.orderId, "assigned");

        // Update chat room participants to ensure notifications work
        updateChatRoomParticipants(input.orderId, order.customerId, ctx.user.id);

        // Send OneSignal Push Notification to customer
        await sendOneSignalNotification({ userId: order.customerId }, {
          title: "تم قبول طلبك! 🚗",
          body: `الكابتن ${driver.name} في طريقه إليك الآن.`,
          orderId: order.id,
          url: `/customer/orders/${order.id}`,
        });

        return { success: true };
      }),

    // Reject order by driver (removes from their view only)
    rejectOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "driver") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only drivers can reject orders",
          });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Check if order is still available (not assigned)
        if (order.driverId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Order has already been accepted",
          });
        }

        // Store rejection in database (for future analytics)
        // For now, we just return success - the order remains available for other drivers
        return { success: true };
      }),

    // Complete order and apply commission
    completeOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          paymentConfirmation: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "driver") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "فقط السائقون يمكنهم إكمال الطلبات",
          });
        }

        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الطلب" });
        }

        if (order.driverId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "يمكنك فقط إكمال طلباتك الخاصة",
          });
        }

        // Get commission amount
        const commission = getCommissionPerOrder();
        
        // Update order status to delivered
        await db.updateOrderStatus(input.orderId, "delivered");
        
        // Update driver debt and commission
        const driver = await db.getUserById(ctx.user.id);
        if (!driver) {
          throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على السائق" });
        }

        const currentPending = parseFloat(driver.pendingCommission?.toString() || "0");
        const newPending = currentPending + commission;
        const isSuspended = shouldBlockDriver(newPending);

        // Update driver record
        // تحديث العمولات المستحقة
        const updatedDriver = await db.updateDriverCommission(ctx.user.id, commission);
        
        // تحديث حالة الحساب إذا لزم الأمر
        if (isSuspended && driver.accountStatus !== "disabled") {
          await db.updateAccountStatus(ctx.user.id, "disabled", "عمولات مستحقة تجاوزت 30 جنيه");
        }

        // Send real-time notifications
        const app = (ctx.req as any)?.app;
        if (app?.sendNotificationToUser && updatedDriver) {
          const pendingAmount = parseFloat(updatedDriver.pendingCommission?.toString() || "0");
          
          if (isSuspended) {
            const notificationPayload = {
              title: "تم إيقاف الحساب ⚠️",
              body: `تم إيقاف حسابك بسبب عمولات مستحقة بقيمة ج.م ${pendingAmount.toFixed(2)}`,
            };
            
            app.sendNotificationToUser(ctx.user.id, {
              ...notificationPayload,
              type: "commission_suspended",
              amount: pendingAmount,
              timestamp: new Date().toISOString(),
            });

            // Send OneSignal Push Notification
            await sendOneSignalNotification({ userId: ctx.user.id }, notificationPayload);
          } else if (pendingAmount >= 20 && pendingAmount < 30) {
            const notificationPayload = {
              title: "تنبيه: عمولات مستحقة 💰",
              body: `لديك ج.م ${pendingAmount.toFixed(2)} عمولات مستحقة. يرجى السداد لتجنب إيقاف الحساب.`,
            };

            app.sendNotificationToUser(ctx.user.id, {
              ...notificationPayload,
              type: "commission_warning",
              amount: pendingAmount,
              timestamp: new Date().toISOString(),
            });

            // Send OneSignal Push Notification
            await sendOneSignalNotification({ userId: ctx.user.id }, notificationPayload);
          }
        }

        return {
          success: true,
          commission,
          newDebt: newPending,
          isSuspended,
          message: isSuspended
            ? `تم إيقاف حسابك بسبب عمولات مستحقة بقيمة ج.م ${newPending.toFixed(2)}`
            : "تم تسليم الطلب بنجاح ✅",
        };
      }),
  }),

  /**
   * Driver location tracking
   */
  location: router({
    // Update driver location
    updateDriverLocation: protectedProcedure
      .input(
        z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          orderId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "driver") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only drivers can update location",
          });
        }

        // Update driver location in both users and driversAvailability tables
        await db.updateUserLocation(ctx.user.id, input.latitude, input.longitude);
        await db.updateDriverLocation(ctx.user.id, input.latitude, input.longitude);

        // Broadcast location update via WebSocket
        // This will be handled by the client-side WebSocket connection

        return { success: true };
      }),

    // Get driver location
    getDriverLocation: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ ctx, input }) => {
        const driver = await db.getUserById(input.driverId);
        if (!driver) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
        }

        return {
          driverId: driver.id,
          latitude: driver.latitude ? parseFloat(driver.latitude.toString()) : null,
          longitude: driver.longitude ? parseFloat(driver.longitude.toString()) : null,
        };
      }),

    // Get current driver location
    getCurrentLocation: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "driver") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only drivers can access this",
        });
      }

      const driver = await db.getUserById(ctx.user.id);
      if (!driver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
      }

      return {
        latitude: driver.latitude ? parseFloat(driver.latitude.toString()) : null,
        longitude: driver.longitude ? parseFloat(driver.longitude.toString()) : null,
      };
    }),

    // Get all active drivers
    getActiveDrivers: publicProcedure.query(async () => {
      return await db.getActiveDrivers();
    }),
  }),

  /**
   * Notifications
   */
  notifications: router({
    // Send notification to drivers about new order
    notifyNewOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          title: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "customer") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only customers can trigger notifications",
          });
        }

        // In a real app, this would send push notifications to all available drivers
        // For now, we just return success
        return { success: true, message: "Notification sent to available drivers" };
      }),
  }),

  /**
   * Admin routes
   */
  admin: router({
    // Get statistics (Admin only)
    getStatistics: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await db.getStatistics();
    }),

    // Get all users (Admin only)
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const users = await db.getAllUsers();
      return users.map((u) => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        accountStatus: u.accountStatus,
        pendingCommission: u.pendingCommission ? parseFloat(u.pendingCommission.toString()) : 0,
        createdAt: u.createdAt,
      }));
    }),

    // Get all orders (Admin only)
    getAllOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const orders = await db.getAllOrders();
      return orders.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        driverId: o.driverId,
        status: o.status,
        pickupLocation: o.pickupLocation,
        deliveryLocation: o.deliveryLocation,
        price: o.price ? parseFloat(o.price.toString()) : 0,
        distance: o.distance ? parseFloat(o.distance.toString()) : 0,
        createdAt: o.createdAt,
      }));
    }),

    // Update user account status (Admin only)
    updateAccountStatus: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          status: z.enum(["active", "suspended", "disabled"]),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        await db.updateAccountStatus(input.userId, input.status, input.reason);

        // Send notification to user
        const app = (ctx.req as any)?.app;
        const notificationPayload = {
          title: input.status === "active" ? "تم تفعيل حسابك! 🎉" : "تم تعليق حسابك ⚠️",
          body: input.status === "active" 
            ? "يمكنك الآن البدء في استخدام التطبيق بشكل طبيعي." 
            : (input.reason || "تم تعليق حسابك من قبل الإدارة"),
        };

        if (app?.sendNotificationToUser) {
          app.sendNotificationToUser(input.userId, {
            ...notificationPayload,
            type: "account_status_changed",
            timestamp: new Date().toISOString(),
          });
        }

        // Send OneSignal Push Notification
        await sendOneSignalNotification({ userId: input.userId }, notificationPayload);

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            accountStatus: input.status,
            pendingCommission: user.pendingCommission,
            isActive: input.status === "active",
          },
        };
      }),

    // Delete user
    deleteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        await db.deleteUser(input.userId);
        return { success: true, message: "User deleted successfully" };
      }),

    // Delete order
    deleteOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        await db.deleteOrder(input.orderId);
        return { success: true, message: "Order deleted successfully" };
      }),

    // Get report data for export
    getReportData: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        return await db.getReportData(input.startDate, input.endDate);
      }),

    // Send manual notification (Admin only)
    sendManualNotification: protectedProcedure
      .input(
        z.object({
          target: z.enum(["all", "drivers", "customers", "specific"]),
          userId: z.number().optional(),
          title: z.string().min(1, "العنوان مطلوب"),
          body: z.string().min(1, "نص الرسالة مطلوب"),
          url: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        console.log(`[AdminNotification] Sending manual notification to ${input.target}: ${input.title}`);
        
        try {
          let targetParam: any = {};
          if (input.target === "specific" && input.userId) {
            targetParam = { userId: input.userId };
          } else if (input.target === "drivers") {
            targetParam = { role: "driver" };
          } else if (input.target === "customers") {
            targetParam = { role: "customer" };
          } else {
            targetParam = { included_segments: ["Subscribed Users"] };
          }

          // ننتظر الإرسال للتأكد من نجاحه
          await sendOneSignalNotification(targetParam, {
            title: input.title,
            body: input.body,
            url: input.url || "/",
          });

          return { success: true, message: "تم إرسال الإشعار بنجاح" };
        } catch (error: any) {
          console.error("[AdminNotification] Failed to initiate manual notification:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "فشل في إرسال الإشعار: " + (error.message || "خطأ غير معروف"),
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Final update to ensure deployment and verify push status - Apr 14, 2026
