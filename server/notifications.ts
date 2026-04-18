import { getFirebaseMessaging } from "./firebase-admin-config";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * إرسال إشعار لموضوع معين (Topic)
 */
export async function sendToTopic(topic: string, title: string, body: string, data?: any) {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error("[Notifications] Firebase Admin not initialized");
      return false;
    }

    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "default_channel",
        },
      },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          title,
          body,
          requireInteraction: true,
          icon: "/logo.jpg",
        },
        fcmOptions: {
          link: data?.url || "/driver/dashboard",
        },
      },
      topic: topic,
    };

    const response = await messaging.send(message);
    console.log(`[Notifications] Successfully sent to topic ${topic}:`, response);
    return true;
  } catch (error) {
    console.error(`[Notifications] Error sending to topic ${topic}:`, error);
    return false;
  }
}

/**
 * إشعار السائقين بطلب جديد (عبر موضوع drivers)
 */
export async function notifyDriversOfNewOrder(orderId: number) {
  const title = "🚀 طلب جديد متاح!";
  const body = `يوجد طلب جديد رقم #${orderId}. اضغط للتفاصيل والقبول.`;
  
  return sendToTopic("drivers", title, body, {
    type: "new_order",
    orderId: orderId.toString(),
    tag: "order-new",
    url: `/driver/dashboard?orderId=${orderId}`
  });
}

/**
 * إرسال إشعار لمستخدم محدد عبر التوكنات الخاصة به
 */
export async function sendToUser(userId: number, title: string, body: string, data?: any) {
  try {
    const messaging = getFirebaseMessaging();
    const db = await getDb();
    if (!messaging || !db) return false;

    // جلب توكنات المستخدم من قاعدة البيانات
    const userSubs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (userSubs.length === 0) {
      console.log(`[Notifications] No push tokens found for user ${userId}`);
      return false;
    }

    const tokens = userSubs.map(s => s.endpoint);
    
    const message = {
      notification: { title, body },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens: tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`[Notifications] Sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failure`);
    
    return response.successCount > 0;
  } catch (error) {
    console.error(`[Notifications] Error sending to user ${userId}:`, error);
    return false;
  }
}
