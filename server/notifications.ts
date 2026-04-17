import { Response } from "express";
import webpush from "web-push";
import * as admin from "firebase-admin";
import { getDb, getAllUsers } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Configure web push with VAPID keys
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@wasly.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Configure Firebase Admin SDK
const firebaseConfig = process.env.FIREBASE_SERVICE_ACCOUNT;
if (firebaseConfig) {
  try {
    let serviceAccount;
    if (firebaseConfig.startsWith('{')) {
      serviceAccount = JSON.parse(firebaseConfig);
    } else {
      // Handle base64 encoded config if needed
      serviceAccount = JSON.parse(Buffer.from(firebaseConfig, 'base64').toString());
    }
    
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Notifications] Firebase Admin SDK initialized successfully");
    }
  } catch (error) {
    console.error("[Notifications] Failed to initialize Firebase Admin SDK:", error);
  }
}

// Store active SSE connections
const activeConnections = new Map<number, Response>();

/**
 * Register an SSE connection for a user
 */
export function registerSSEConnection(userId: number, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.write('data: {"type":"connected","message":"Connected to notifications"}\n\n');
  activeConnections.set(userId, res);

  res.on("close", () => { activeConnections.delete(userId); });
  res.on("error", () => { activeConnections.delete(userId); });
}

/**
 * Send notification to a specific user (Web Push & Firebase)
 */
export async function sendPushNotificationToUser(
  userId: number,
  notification: {
    title: string;
    body: string;
    orderId?: number;
    url?: string;
    tag?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // 1. Web Push (Browser)
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as any },
          JSON.stringify(notification)
        );
      } catch (error: any) {
        if (error.statusCode === 410) await removePushSubscription(sub.endpoint);
      }
    }
  } catch (error) {
    console.error("[Notifications] Web Push error:", error);
  }

  // 2. Firebase Push (Mobile App)
  if (admin.apps.length > 0) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        android: {
          priority: "high" as any,
          notification: {
            channelId: "default_channel",
            priority: "max" as any,
            visibility: "public" as any,
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: "default",
              badge: 1,
            },
          },
        },
        data: {
          orderId: notification.orderId?.toString() || "",
          url: notification.url || "",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        topic: `user_${userId}`,
      };

      await admin.messaging().send(message);
      console.log(`[Notifications] Firebase message sent to topic: user_${userId}`);
    } catch (error) {
      console.error("[Notifications] Firebase Push failed:", error);
    }
  }
}

/**
 * Notify all drivers of a new order
 */
export async function notifyDriversOfNewOrder(
  orderId: number,
  message: string
): Promise<void> {
  try {
    const allUsers = await getAllUsers();
    const activeDrivers = allUsers.filter(
      (u: any) => u.role === "driver" && u.accountStatus === "active"
    );

    const notification = {
      title: "طلب توصيل جديد! 🚗",
      body: message,
      orderId,
      url: `/driver/orders/${orderId}`,
      tag: `order-${orderId}`,
    };

    // 1. Send Web Push to each active driver
    for (const driver of activeDrivers) {
      await sendPushNotificationToUser(driver.id, notification);
    }

    // 2. Broadcast to Firebase "drivers" topic for mobile apps
    if (admin.apps.length > 0) {
      try {
        const topicMessage = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          android: {
            priority: "high" as any,
            notification: {
              channelId: "default_channel",
              priority: "max" as any,
              visibility: "public" as any,
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: notification.title,
                  body: notification.body,
                },
                sound: "default",
                badge: 1,
                "content-available": 1,
              },
            },
          },
          data: {
            orderId: orderId.toString(),
            url: notification.url || "",
          },
          topic: "drivers",
        };
        await admin.messaging().send(topicMessage);
        console.log("[Notifications] Firebase broadcast sent to 'drivers' topic");
      } catch (error) {
        console.error("[Notifications] Firebase broadcast failed:", error);
      }
    }

    // 3. Send OneSignal Push Notification to all drivers
    const ONESIGNAL_APP_ID = "c7e88fa4-df0e-42a5-960a-fd9088b949b4";
    const ONESIGNAL_REST_API_KEY = "os_v2_app_y7ui7jg7bzbklfqk7wiirokjwqxujf2awfaes6nbchj2hvkqcmfkjayufnh5zg3z2bkvi6bcm7wg52jbyh3mv5kgrkaimtidxv4n5qa";

    try {
      const axios = (await import("axios")).default;
      await axios.post(
        "https://onesignal.com/api/v1/notifications",
        {
          app_id: ONESIGNAL_APP_ID,
          included_segments: ["Subscribed Users"],
          // We can also target specific drivers if we have their external_id
          // filters: [{ field: "tag", key: "role", relation: "=", value: "driver" }],
          contents: { en: message, ar: message },
          headings: { en: "New Order Available! 🚗", ar: "طلب توصيل جديد! 🚗" },
          data: { orderId: orderId.toString(), url: notification.url },
          android_accent_color: "FF0000",
          priority: 10,
        },
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
        }
      );
      console.log("[Notifications] OneSignal broadcast sent successfully");
    } catch (error: any) {
      console.error("[Notifications] OneSignal broadcast failed:", error.response?.data || error.message);
    }
  } catch (error) {
    console.error("[Notifications] Failed to notify drivers:", error);
  }
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  } catch (error) {
    console.error("[Notifications] Failed to remove subscription:", error);
  }
}

export function getVapidPublicKey(): string { return vapidPublicKey; }
export function isPushNotificationsConfigured(): boolean { return !!(vapidPublicKey && vapidPrivateKey); }
