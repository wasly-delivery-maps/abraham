import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { notifyDriversOfNewOrder, notifyCustomerOfOrderStatusChange } from "./notifications";
import axios from "axios";
import { ENV } from "./_core/env";

// Helper to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to calculate order price based on distance and neighborhoods
function calculateOrderPrice(pickupNeighborhood: string, deliveryNeighborhood: string, distance: number) {
  // Base price for within the same neighborhood
  if (pickupNeighborhood && deliveryNeighborhood && pickupNeighborhood === deliveryNeighborhood) {
    return 15;
  }
  
  // Base price for different neighborhoods
  let price = 20;
  
  // Add distance-based pricing (e.g., 5 EGP per km beyond 3km)
  if (distance > 3) {
    price += Math.ceil(distance - 3) * 5;
  }
  
  return price;
}

export const appRouter = router({
  users: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.upsertUser({
          id: ctx.user.id,
          openId: ctx.user.openId,
          ...input,
        });
      }),
    uploadAvatar: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const avatarUrl = `data:${input.contentType};base64,${input.base64}`;
        return await db.upsertUser({
          id: ctx.user.id,
          openId: ctx.user.openId,
          avatarUrl,
        });
      }),
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAllUsers();
    }),
    getAllDrivers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAllDrivers();
    }),
  }),

  orders: router({
    getCustomerOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByCustomerId(ctx.user.id);
    }),
    getDriverOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "driver") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getOrdersByDriverId(ctx.user.id);
    }),
    getAvailableOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "driver") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAvailableOrders();
    }),
    getOrderById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderById(input.orderId);
      }),
    
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
          deliveryLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }),
          pickupLocation: z.object({
            address: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            neighborhood: z.string().optional(),
          }).optional(),
          couponId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get restaurant info
        const restaurant = await db.getRestaurantById(input.restaurantId);
        if (!restaurant) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Restaurant not found",
          });
        }

        const pickupLocation = input.pickupLocation || {
          address: restaurant.address,
          latitude: parseFloat(restaurant.latitude),
          longitude: parseFloat(restaurant.longitude),
          neighborhood: "",
        };

        let restaurantName = restaurant.name;
        // Special case for hardcoded restaurants if needed
        if (input.restaurantId === 2) {
          restaurantName = "كشري الخديوي";
        } else if (input.restaurantId === 3) {
          restaurantName = "مطعم الحوت";
        } else if (input.pickupLocation?.address) {
          restaurantName = input.pickupLocation.address.split(',')[0].split('-')[0].trim();
        }

        const distance = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          input.deliveryLocation.latitude,
          input.deliveryLocation.longitude
        );

        const estimatedTime = Math.round(distance * 5 + 5);

        const deliveryPrice = calculateOrderPrice(
          pickupLocation.neighborhood || "",
          input.deliveryLocation.neighborhood,
          distance
        );

        const result = await db.createOrder({
          customerId: ctx.user.id,
          pickupLocation,
          deliveryLocation: input.deliveryLocation,
          price: deliveryPrice,
          distance,
          estimatedTime,
          notes: `المطعم: ${restaurantName}\nالعنوان: ${input.deliveryLocation.address}\nالملاحظات: ${input.notes || "بدون ملاحظات"}\nقيمة الطعام: ج.م ${input.totalPrice}`,
          couponId: input.couponId,
        });

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
          
          const itemDetails = await Promise.all(
            input.items.map(async (item) => {
              const menuItem = await db.getMenuItemById(item.menuItemId);
              const itemName = menuItem?.name || `صنف #${item.menuItemId}`;
              return `${itemName} × ${item.quantity} = ${item.price * item.quantity} ج.م`;
            })
          );

          const message = `طلب جديد من تطبيق وصلي 📱\n\n` +
            `*المطعم:* ${restaurantName}\n\n` +
            `${itemDetails.join("\n")}\n\n` +
            `*الإجمالي الأصلي:* ${input.totalPrice} ج.م\n` +
            `*سعر التوصيل:* ${deliveryPrice} ج.م\n` +
            `*العميل:* ${customerName} (${customerPhone})\n` +
            `*العنوان:* ${input.deliveryLocation.address}\n\n` +
            `*الملاحظات:* ${input.notes || "بدون ملاحظات"}`;

          const WHATSAPP_API_URL = ENV.whatsappApiUrl;
          const WHATSAPP_TOKEN = ENV.whatsappToken;
          const WHATSAPP_INSTANCE_ID = ENV.whatsappInstanceId;
          const CALLMEBOT_API_KEY = ENV.callmebotApiKey;

          if (WHATSAPP_TOKEN && WHATSAPP_INSTANCE_ID) {
            await axios.post(`${WHATSAPP_API_URL}/instance${WHATSAPP_INSTANCE_ID}/messages/chat`, {
              token: WHATSAPP_TOKEN,
              to: ownerPhone,
              body: message
            });
          } else if (CALLMEBOT_API_KEY) {
            const encodedMessage = encodeURIComponent(message);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${ownerPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;
            await axios.get(url);
          }
        } catch (waError) {
          console.error("[WhatsApp Restaurant] Failed to send notification:", waError);
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

        const distance = calculateDistance(
          input.pickupLocation.latitude,
          input.pickupLocation.longitude,
          input.deliveryLocation.latitude,
          input.deliveryLocation.longitude
        );

        const estimatedTime = Math.round(distance * 5 + 5);

        let calculatedPrice = input.price;
        if (!calculatedPrice) {
          calculatedPrice = calculateOrderPrice(
            input.pickupLocation.neighborhood || "",
            input.deliveryLocation.neighborhood,
            distance
          );
        }

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

        await notifyDriversOfNewOrder(result.id, `يوجد طلب جديد متاح الآن بقيمة ج.م ${calculatedPrice}. اضغط للتفاصيل وقبول الطلب! 🚀`);

        try {
          const ownerPhone = "201557564373";
             const customer = await db.getUserById(ctx.user.id);
          const customerName = customer?.name || "عميل";
          const customerPhone = customer?.phone || "غير معروف";
          
          const message = `*طلب جديد من تطبيق وصلي* 🚀\n\n` +
            `*رقم الطلب:* #${result.id}\n` +
            `*العميل:* ${customerName}\n` +
            `*رقم الهاتف:* ${customerPhone}\n` +
            `*من:* ${input.pickupLocation.address}\n` +
            `*إلى:* ${input.deliveryLocation.address}\n` +
            `*التكلفة:* ${calculatedPrice} ج.م\n` +
            `*المسافة:* ${distance.toFixed(1)} كم\n` +
            `*ملاحظات:* ${input.notes || "لا يوجد"}`;

          const WHATSAPP_API_URL = ENV.whatsappApiUrl;
          const WHATSAPP_TOKEN = ENV.whatsappToken;
          const WHATSAPP_INSTANCE_ID = ENV.whatsappInstanceId;
          const CALLMEBOT_API_KEY = ENV.callmebotApiKey;

          if (WHATSAPP_TOKEN && WHATSAPP_INSTANCE_ID) {
            await axios.post(`${WHATSAPP_API_URL}/instance${WHATSAPP_INSTANCE_ID}/messages/chat`, {
              token: WHATSAPP_TOKEN,
              to: ownerPhone,
              body: message
            });
          } else if (CALLMEBOT_API_KEY) {
            const encodedMessage = encodeURIComponent(message);
            const url = `https://api.callmebot.com/whatsapp.php?phone=${ownerPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;
            await axios.get(url);
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

    acceptOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "driver") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateOrderStatus(input.orderId, "accepted");
        await db.assignOrderToDriver(input.orderId, ctx.user.id);
        
        const order = await db.getOrderById(input.orderId);
        if (order) {
          await notifyCustomerOfOrderStatusChange(order.customerId, "تم قبول طلبك! الكابتن في طريقه إليك. 🚗");
        }
        
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ orderId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        
        const order = await db.getOrderById(input.orderId);
        if (order) {
          let message = "تم تحديث حالة طلبك.";
          if (input.status === "picked_up") message = "تم استلام طلبك وهو في الطريق إليك! 📦";
          if (input.status === "delivered") message = "تم توصيل طلبك بنجاح. شكراً لاستخدامك وصلي! ✨";
          await notifyCustomerOfOrderStatusChange(order.customerId, message);
        }
        
        return { success: true };
      }),
  }),

  restaurants: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllRestaurants();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRestaurantById(input.id);
      }),
    getMenuItems: publicProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMenuItemsByRestaurantId(input.restaurantId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
