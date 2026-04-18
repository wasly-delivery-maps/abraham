import { Response } from "express";
import webpush from "web-push";
import * as admin from "firebase-admin";
import { getDb, getAllUsers, getPushSubscriptionsByUserId, deletePushSubscription } from "./db";

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
    const subscriptions = await getPushSubscriptionsByUserId(userId);
    
    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys as any },
            JSON.stringify(notification)
          );
        } catch (error: any) {
          if (error.statusCode === 410) await deletePushSubscription(sub.endpoint);
        }
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
 * Send a notification via OneSignal
 */
export async function sendOneSignalNotification(
  target: { userId?: number; role?: string } | any,
  notification?: { title: string; body: string; orderId?: number; url?: string }
): Promise<void> {
  // Handle old call format if necessary
  if (!notification && target.title) {
    notification = target;
    target = { role: "driver" };
  }
  const ONESIGNAL_APP_ID = process.env.VITE_APP_ID || "c7e88fa4-df0e-42a5-960a-fd9088b949b4";
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
  
  if (!ONESIGNAL_REST_API_KEY) {
    console.error("[Notifications] Missing ONESIGNAL_REST_API_KEY environment variable");
    return;
  }

  try {
    const axios = (await import("axios")).default;
    const filters: any[] = [];
    
    if (target.userId) {
      // Target specific user by their phone number (which we use as external_id)
      const user = await (await import("./db")).getUserById(target.userId);
      if (user && user.phone) {
        filters.push({ field: "tag", key: "external_id", relation: "=", value: user.phone });
      }
    }
    
    if (target.role) {
      // Target all users with a specific role tag
      filters.push({ field: "tag", key: "role", relation: "=", value: target.role });
    }

    // Prepare notification payload
    const notificationPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: notification.body, ar: notification.body },
      headings: { en: notification.title, ar: notification.title },
      data: { orderId: notification.orderId?.toString(), url: notification.url },
      
      // إعدادات شاشة القفل والأولوية القصوى
      priority: 10, // أهمية قصوى (High Priority)
      android_visibility: 1, // 1 تعني Public (يظهر المحتوى على شاشة القفل)
      
      // تفعيل الصوت والاهتزاز لجذب الانتباه واستيقاظ الشاشة
      android_channel_id: "push_notifications_urgent", 
      android_accent_color: "FF0000",
      android_led_color: "FF0000",
      android_sound: "notification",
      vibration_pattern: [200, 100, 200, 100, 200, 100, 200], // نمط اهتزاز قوي
      
      small_icon: "ic_stat_onesignal_default",
      large_icon: "https://web-production-0eb1b.up.railway.app/logo.jpg",
      ttl: 259200, // وقت الصلاحية (3 أيام)
      
      // إضافة أزرار تفاعلية لزيادة أولوية الإشعار في نظام أندرويد
      buttons: [
        { id: "view_order", text: "عرض الطلب", icon: "ic_menu_view" },
        { id: "accept_order", text: "قبول الطلب الآن", icon: "ic_menu_send" }
      ],
    };

    // Apply filters or target all subscribed users
    if (filters.length > 0) {
      notificationPayload.filters = filters;
    } else {
      notificationPayload.included_segments = ["Subscribed Users"];
    }

    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notificationPayload,
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );
    console.log(`[Notifications] OneSignal notification sent successfully to ${target.userId ? 'user ' + target.userId : (target.role ? 'role ' + target.role : 'all users')}`);
  } catch (error: any) {
    console.error("[Notifications] OneSignal notification failed:", error.response?.data || error.message);
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
    console.log(`[Notifications] Starting notification process for order ${orderId}`);
    
    const allUsers = await getAllUsers();
    const activeDrivers = allUsers.filter(
      (u: any) => u.role === "driver" && u.accountStatus === "active"
    );

    console.log(`[Notifications] Found ${activeDrivers.length} active drivers to notify`);

    const notification = {
      title: "طلب توصيل جديد! 🚗",
      body: message,
      orderId,
      url: `/driver/orders/${orderId}`,
      tag: `order-${orderId}`,
    };

    // 1. Send Web Push to each active driver
    console.log(`[Notifications] Sending Web Push notifications to ${activeDrivers.length} drivers`);
    let webPushSuccessCount = 0;
    for (const driver of activeDrivers) {
      try {
        await sendPushNotificationToUser(driver.id, notification);
        webPushSuccessCount++;
      } catch (error) {
        console.error(`[Notifications] Failed to send web push to user ${driver.id}:`, error);
      }
    }
    console.log(`[Notifications] Web Push sent successfully to ${webPushSuccessCount}/${activeDrivers.length} drivers`);

    // 2. Broadcast to Firebase "drivers" topic for mobile apps
    if (admin.apps.length > 0) {
      try {
        console.log("[Notifications] Sending Firebase broadcast to 'drivers' topic");
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
        console.log("[Notifications] Firebase broadcast sent to 'drivers' topic successfully");
      } catch (error) {
        console.error("[Notifications] Firebase broadcast failed:", error);
      }
    } else {
      console.warn("[Notifications] Firebase Admin SDK not initialized, skipping Firebase broadcast");
    }

    // 3. Send OneSignal Push Notification to ALL drivers
    // We target by role="driver" to ensure only drivers get the new order notification
    console.log("[Notifications] Sending OneSignal notification to drivers");
    await sendOneSignalNotification({ role: "driver" }, notification);
    console.log("[Notifications] OneSignal notification sent successfully");
  } catch (error) {
    console.error("[Notifications] Failed to notify drivers:", error);
  }
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await deletePushSubscription(endpoint);
}

export function getVapidPublicKey(): string { return vapidPublicKey; }
export function isPushNotificationsConfigured(): boolean { return !!(vapidPublicKey && vapidPrivateKey); }
