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
  pushSubscriptions,
  InsertPushSubscription,
  offers,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

// In-memory database for development
interface InMemoryDB {
  users: Map<number, any>;
  orders: Map<number, any>;
  driversAvailability: Map<number, any>;
  notifications: Map<number, any>;
  orderHistory: Map<number, any>;
  offers: Map<number, any>;
  nextUserId: number;
  nextOrderId: number;
}

const inMemoryDB: InMemoryDB = {
  users: new Map(),
  orders: new Map(),
  driversAvailability: new Map(),
  notifications: new Map(),
  orderHistory: new Map(),
  offers: new Map(),
  nextUserId: 1,
  nextOrderId: 1,
};

let _db: ReturnType<typeof drizzle> | null = null;
let _useInMemory = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("[Database] DATABASE_URL not set, falling back to in-memory database");
      _useInMemory = true;
      return null;
    }

    try {
      // Use mysql2 connection pool
      const mysql = await import('mysql2/promise');
      const pool = mysql.createPool(dbUrl);
      _db = drizzle(pool);
      _useInMemory = false;
      console.log("[Database] Connected to database successfully");
    } catch (error: any) {
      console.error("[Database] CRITICAL: Failed to connect to database:", error.message || error);
      console.log("[Database] Falling back to in-memory database");
      _useInMemory = true;
      return null;
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
  if (!db && !_useInMemory) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  // In-memory implementation
  if (_useInMemory) {
    const openId = user.openId || `phone-${user.phone}`;
    let existingUser = Array.from(inMemoryDB.users.values()).find(u => u.openId === openId || u.phone === user.phone);
    
    if (!existingUser) {
      existingUser = {
        id: inMemoryDB.nextUserId++,
        openId,
        phone: user.phone || null,
        password: user.password || null,
        name: user.name || null,
        email: user.email || null,
        role: user.role || 'customer',
        isActive: user.isActive !== undefined ? user.isActive : true,
        lastSignedIn: user.lastSignedIn || new Date(),
        latitude: null,
        longitude: null,
        loginMethod: user.loginMethod || null,
        createdAt: new Date(),
      };
      inMemoryDB.users.set(existingUser.id, existingUser);
    } else {
      // Update existing user
      if (user.phone !== undefined) existingUser.phone = user.phone;
      if (user.password !== undefined) existingUser.password = user.password;
      if (user.name !== undefined) existingUser.name = user.name;
      if (user.email !== undefined) existingUser.email = user.email;
      if (user.role !== undefined) existingUser.role = user.role;
      if (user.isActive !== undefined) existingUser.isActive = user.isActive;
      if (user.lastSignedIn !== undefined) existingUser.lastSignedIn = user.lastSignedIn;
      if (user.loginMethod !== undefined) existingUser.loginMethod = user.loginMethod;
    }
    return existingUser;
  }

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

    const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
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
  if (!db && !_useInMemory) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // In-memory implementation
  if (_useInMemory) {
    return Array.from(inMemoryDB.users.values()).find(u => u.openId === openId);
  }

  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string) {
  const db = await getDb();
  
  // Normalize phone for lookup
  const normalizedPhone = phone.startsWith('+') ? phone : (phone.startsWith('0') ? `+20${phone.substring(1)}` : `+20${phone}`);

  // In-memory implementation
  if (_useInMemory) {
    return Array.from(inMemoryDB.users.values()).find(u => u.phone === normalizedPhone || u.phone === phone);
  }

  if (!db) return undefined;
  
  // Try both normalized and original phone
  const result = await db.select().from(users).where(
    sql`${users.phone} = ${normalizedPhone} OR ${users.phone} = ${phone}`
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db && !_useInMemory) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  // In-memory implementation
  if (_useInMemory) {
    return inMemoryDB.users.get(id);
  }

  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

/**
 * Get all drivers
 */
export async function getAllDrivers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get drivers: database not available");
    return [];
  }

  return await db.select().from(users).where(eq(users.role, "driver"));
}

/**
 * Get available drivers
 */
export async function getAvailableDrivers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get available drivers: database not available");
    return [];
  }

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
  if (!db) {
    console.warn("[Database] Cannot update driver location: database not available");
    return;
  }

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
 * Get active offers (not expired and isActive is true)
 */
export async function getActiveOffers() {
  const db = await getDb();
  // Add a small buffer (1 second) to account for timing issues between offer creation and query execution
  const now = new Date(Date.now() - 1000);

  if (_useInMemory) {
    return Array.from(inMemoryDB.offers.values()).filter(
      (o) => o.isActive && new Date(o.expiresAt) > now
    );
  }

  if (!db) return [];

  return await db
    .select()
    .from(offers)
    .where(and(eq(offers.isActive, true), sql`${offers.expiresAt} > ${now}`));
}

/**
 * Create a new offer
 */
export async function createOffer(offer: any) {
  const db = await getDb();
  
  if (_useInMemory) {
    const newOffer = {
      id: inMemoryDB.offers.size + 1,
      ...offer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryDB.offers.set(newOffer.id, newOffer);
    return newOffer;
  }

  if (!db) return null;
  
  // Clean the offer object and ensure expiresAt is a Date
  const { id, createdAt, updatedAt, ...cleanOffer } = offer;
  
  let expiresAtDate: Date;
  if (cleanOffer.expiresAt instanceof Date) {
    expiresAtDate = cleanOffer.expiresAt;
  } else {
    expiresAtDate = new Date(cleanOffer.expiresAt);
  }

  // Fallback for invalid dates
  if (isNaN(expiresAtDate.getTime())) {
    expiresAtDate = new Date();
    expiresAtDate.setHours(expiresAtDate.getHours() + 24);
  }

  // We rely on MySQL defaults for createdAt and updatedAt
  // We only send the fields that are absolutely necessary
  const values: any = {
    title: cleanOffer.title,
    description: cleanOffer.description || null,
    imageUrl: cleanOffer.imageUrl,
    link: cleanOffer.link || null,
    isActive: cleanOffer.isActive !== undefined ? cleanOffer.isActive : true,
    expiresAt: expiresAtDate,
  };
  
  try {
    // Using direct SQL for the insert to be more robust against schema mismatches
    const [result] = await db.insert(offers).values(values);
    return { id: (result as any).insertId, ...values };
  } catch (error) {
    console.error("[Database] Failed to create offer:", error);
    throw error;
  }
}

/**
 * Delete an offer
 */
export async function deleteOffer(id: number) {
  const db = await getDb();

  if (_useInMemory) {
    inMemoryDB.offers.delete(id);
    return true;
  }

  if (!db) return false;
  await db.delete(offers).where(eq(offers.id, id));
  return true;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: number, data: any) {
  const db = await getDb();
  
  if (_useInMemory) {
    const user = inMemoryDB.users.get(userId);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  if (!db) return null;
  
  try {
    await db.update(users).set(data).where(eq(users.id, userId));
    return await getUserById(userId);
  } catch (error) {
    console.error("[Database] Failed to update user profile:", error);
    throw error;
  }
}

/**
 * Get available orders for drivers
 */
export async function getAvailableOrders() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(orders).where(eq(orders.status, "pending"));
}

/**
 * Upsert push subscription
 */
export async function upsertPushSubscription(userId: number, subscription: any) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    }).onDuplicateKeyUpdate({
      set: {
        keys: subscription.keys,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert push subscription:", error);
  }
}
