import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  orders,
  driversAvailability,
  notifications,
  orderHistory,
  Order,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _useInMemory = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    if (ENV.databaseUrl) {
      try {
        const mysql = await import('mysql2/promise');
        const pool = mysql.createPool({
          uri: ENV.databaseUrl,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          ssl: {
            rejectUnauthorized: false
          },
          enableKeepAlive: true,
          keepAliveInitialDelaySeconds: 0,
        });
        _db = drizzle(pool);
        _useInMemory = false;
        console.log("[Database] Connected to MySQL successfully via DATABASE_URL");
      } catch (error: any) {
        console.error("[Database] CRITICAL: Failed to connect to MySQL:", error.message || error);
        throw new Error("Database connection failed");
      }
    } else {
      console.error("[Database] CRITICAL: DATABASE_URL is not set");
      throw new Error("DATABASE_URL is required");
    }
  }
  return _db;
}

/**
 * Create or update a user
 */
export async function upsertUser(user: InsertUser): Promise<any> {
  if (!user.openId && !user.phone) {
    throw new Error("User openId or phone is required for upsert");
  }

  const db = await getDb();
  
  try {
    // Generate openId from phone if not provided
    const openId = user.openId || (user.phone ? `phone-${user.phone}` : `user-${Date.now()}`);
    
    const values: InsertUser = {
      openId: openId,
    };
    const updateSet: Record<string, unknown> = {};

    if (user.phone !== undefined && user.phone !== null) {
      values.phone = user.phone;
      updateSet.phone = user.phone;
    }
    if (user.password !== undefined && user.password !== null) {
      values.password = user.password;
      updateSet.password = user.password;
    }

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else {
      values.role = 'customer';
    }

    if (user.isActive !== undefined) {
      values.isActive = user.isActive;
      updateSet.isActive = user.isActive;
    } else {
      values.isActive = true;
    }
    
    if (user.accountStatus !== undefined) {
      values.accountStatus = user.accountStatus;
      updateSet.accountStatus = user.accountStatus;
    } else {
      values.accountStatus = 'active';
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    if (db) {
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get user by openId
 */
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

/**
 * Get all drivers
 */
export async function getAllDrivers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, "driver"));
}

/**
 * Get available drivers
 */
export async function getAvailableDrivers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(driversAvailability).where(eq(driversAvailability.isAvailable, true));
}

/**
 * Update driver location
 */
export async function updateDriverLocation(
  driverId: number,
  latitude: number,
  longitude: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .insert(driversAvailability)
      .values({
        driverId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        isAvailable: true,
      })
      .onDuplicateKeyUpdate({
        set: {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to update driver location:", error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: { name?: string; email?: string; phone?: string }
) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const updateSet: Record<string, unknown> = {};
    if (data.name !== undefined) updateSet.name = data.name;
    if (data.email !== undefined) updateSet.email = data.email;
    if (data.phone !== undefined) updateSet.phone = data.phone;

    if (Object.keys(updateSet).length === 0) {
      return await getUserById(userId);
    }

    await db.update(users).set(updateSet).where(eq(users.id, userId));
    return await getUserById(userId);
  } catch (error) {
    console.error("[Database] Failed to update user profile:", error);
    throw error;
  }
}

/**
 * Update user location
 */
export async function updateUserLocation(
  userId: number,
  latitude: number,
  longitude: number
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(users)
      .set({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user location:", error);
    throw error;
  }
}

/**
 * Create a new order
 */
export async function createOrder(order: any) {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.insert(orders).values(order);
    const insertId = (result as any)[0].insertId;
    
    // Add to history
    await db.insert(orderHistory).values({
      orderId: insertId,
      status: "pending",
      notes: "Order created",
    });
    
    return { ...order, id: insertId };
  } catch (error) {
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all orders for a customer
 */
export async function getCustomerOrders(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(sql`${orders.createdAt} DESC`);
}

/**
 * Get all orders for a driver
 */
export async function getDriverOrders(driverId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(sql`${orders.createdAt} DESC`);
}

/**
 * Get all pending orders
 */
export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.status, "pending")).orderBy(sql`${orders.createdAt} DESC`);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: number,
  status: string,
  driverId?: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    const updateSet: any = { status };
    if (driverId !== undefined) updateSet.driverId = driverId;
    if (status === "delivered") updateSet.deliveredAt = new Date();

    await db.update(orders).set(updateSet).where(eq(orders.id, orderId));

    // Add to history
    await db.insert(orderHistory).values({
      orderId,
      status,
      notes: notes || `Status updated to ${status}`,
    });

    return await getOrderById(orderId);
  } catch (error) {
    console.error("[Database] Failed to update order status:", error);
    throw error;
  }
}

/**
 * Create notification
 */
export async function createNotification(notification: any) {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.insert(notifications).values(notification);
    return { ...notification, id: (result as any)[0].insertId };
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(sql`${notifications.createdAt} DESC`);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, id));
  } catch (error) {
    console.error("[Database] Failed to mark notification as read:", error);
    throw error;
  }
}
