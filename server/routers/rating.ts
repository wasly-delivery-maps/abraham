import { router, protectedProcedure } from "./_base";
import { z } from "zod";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const ratingSchema = z.object({
  orderId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const ratingRouter = router({
  // Customer rates driver
  rateDriver: protectedProcedure
    .input(ratingSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { orderId, rating, comment } = input;
        const db = await getDb();

        if (!db) {
          throw new Error("Database connection failed");
        }

        // Get order
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        });

        if (!order) {
          throw new Error("Order not found");
        }

        // Check if user is the customer
        if (order.customerId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Update order with driver rating
        await db
          .update(orders)
          .set({
            driverRating: rating,
            driverRatingComment: comment || null,
            driverRatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        return {
          success: true,
          message: "Driver rated successfully",
        };
      } catch (error) {
        console.error("[Rating] Error rating driver:", error);
        throw error;
      }
    }),

  // Driver rates customer
  rateCustomer: protectedProcedure
    .input(ratingSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { orderId, rating, comment } = input;
        const db = await getDb();

        if (!db) {
          throw new Error("Database connection failed");
        }

        // Get order
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        });

        if (!order) {
          throw new Error("Order not found");
        }

        // Check if user is the driver
        if (order.driverId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Update order with customer rating
        await db
          .update(orders)
          .set({
            customerRating: rating,
            customerRatingComment: comment || null,
            customerRatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        return {
          success: true,
          message: "Customer rated successfully",
        };
      } catch (error) {
        console.error("[Rating] Error rating customer:", error);
        throw error;
      }
    }),

  // Get order rating
  getOrderRating: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();

        if (!db) {
          throw new Error("Database connection failed");
        }

        const order = await db.query.orders.findFirst({
          where: eq(orders.id, input.orderId),
        });

        if (!order) {
          throw new Error("Order not found");
        }

        // Check authorization
        if (
          order.customerId !== ctx.user.id &&
          order.driverId !== ctx.user.id
        ) {
          throw new Error("Unauthorized");
        }

        return {
          driverRating: order.driverRating,
          driverRatingComment: order.driverRatingComment,
          driverRatedAt: order.driverRatedAt,
          customerRating: order.customerRating,
          customerRatingComment: order.customerRatingComment,
          customerRatedAt: order.customerRatedAt,
        };
      } catch (error) {
        console.error("[Rating] Error getting order rating:", error);
        throw error;
      }
    }),

  // Get driver average rating
  getDriverAverageRating: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();

        if (!db) {
          throw new Error("Database connection failed");
        }

        // Get all orders for this driver
        const driverOrders = await db.query.orders.findMany({
          where: eq(orders.driverId, input.driverId),
        });

        // Calculate average rating
        const ratedOrders = driverOrders.filter((o) => o.driverRating !== null);
        const averageRating =
          ratedOrders.length > 0
            ? ratedOrders.reduce((sum, o) => sum + (o.driverRating || 0), 0) /
              ratedOrders.length
            : 0;

        return {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalRatings: ratedOrders.length,
          totalOrders: driverOrders.length,
        };
      } catch (error) {
        console.error("[Rating] Error getting driver average rating:", error);
        throw error;
      }
    }),

  // Get customer average rating
  getCustomerAverageRating: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();

        if (!db) {
          throw new Error("Database connection failed");
        }

        // Get all orders for this customer
        const customerOrders = await db.query.orders.findMany({
          where: eq(orders.customerId, input.customerId),
        });

        // Calculate average rating
        const ratedOrders = customerOrders.filter((o) => o.customerRating !== null);
        const averageRating =
          ratedOrders.length > 0
            ? ratedOrders.reduce((sum, o) => sum + (o.customerRating || 0), 0) /
              ratedOrders.length
            : 0;

        return {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalRatings: ratedOrders.length,
          totalOrders: customerOrders.length,
        };
      } catch (error) {
        console.error("[Rating] Error getting customer average rating:", error);
        throw error;
      }
    }),
});
