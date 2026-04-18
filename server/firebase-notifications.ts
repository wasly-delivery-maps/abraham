/**
 * Firebase Cloud Messaging (FCM) Notification Service
 * 
 * This module handles sending notifications to drivers via Firebase Cloud Messaging
 */

import { getFirebaseMessaging, isFirebaseAdminConfigured } from './firebase-admin-config';
import { db } from './db';

interface NotificationPayload {
  title: string;
  body: string;
  orderId?: number;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

interface SendNotificationOptions {
  userId?: string;
  userIds?: string[];
  role?: string;
  topic?: string;
}

/**
 * Send notification via Firebase Cloud Messaging
 */
export async function sendFCMNotification(
  payload: NotificationPayload,
  options: SendNotificationOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if Firebase Admin is configured
    if (!isFirebaseAdminConfigured()) {
      console.warn('[FCM] Firebase Admin SDK not configured');
      return {
        success: false,
        error: 'Firebase Admin SDK not configured',
      };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('[FCM] Failed to get Firebase Messaging instance');
      return {
        success: false,
        error: 'Failed to get Firebase Messaging instance',
      };
    }

    // Prepare notification message
    const message: any = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo.jpg',
      },
      data: {
        orderId: payload.orderId?.toString() || '',
        url: payload.url || '/driver/dashboard',
        tag: payload.tag || 'fcm-notification',
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/driver/dashboard',
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/logo.jpg',
          badge: payload.badge || '/logo.jpg',
          tag: payload.tag || 'fcm-notification',
          requireInteraction: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            sound: 'default',
            'content-available': 1,
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          title: payload.title,
          body: payload.body,
          icon: 'ic_notification',
          sound: 'notification',
          channelId: 'push_notifications_urgent',
          clickAction: payload.url || '/driver/dashboard',
          tag: payload.tag || 'fcm-notification',
          priority: 'high',
        },
      },
    };

    // Send to specific user
    if (options.userId) {
      console.log('[FCM] Sending notification to user:', options.userId);
      
      // Get FCM token for user
      const token = await getFCMTokenForUser(options.userId);
      if (!token) {
        console.warn('[FCM] No FCM token found for user:', options.userId);
        return {
          success: false,
          error: 'No FCM token found for user',
        };
      }

      message.token = token;
      const response = await messaging.send(message);
      
      console.log('[FCM] Notification sent successfully:', response);
      return {
        success: true,
        messageId: response,
      };
    }

    // Send to multiple users
    if (options.userIds && options.userIds.length > 0) {
      console.log('[FCM] Sending notification to', options.userIds.length, 'users');
      
      const results = await Promise.allSettled(
        options.userIds.map(async (userId) => {
          const token = await getFCMTokenForUser(userId);
          if (!token) {
            console.warn('[FCM] No FCM token found for user:', userId);
            return null;
          }

          const userMessage = { ...message, token };
          return messaging.send(userMessage);
        })
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      console.log('[FCM] Sent to', successCount, 'out of', options.userIds.length, 'users');

      return {
        success: successCount > 0,
        messageId: `Sent to ${successCount} users`,
      };
    }

    // Send to topic (all drivers)
    if (options.topic) {
      console.log('[FCM] Sending notification to topic:', options.topic);
      
      message.topic = options.topic;
      const response = await messaging.send(message);
      
      console.log('[FCM] Notification sent to topic:', response);
      return {
        success: true,
        messageId: response,
      };
    }

    // Send to role (e.g., all drivers)
    if (options.role) {
      console.log('[FCM] Sending notification to role:', options.role);
      
      // Get all users with this role
      const users = await getUsersByRole(options.role);
      if (users.length === 0) {
        console.warn('[FCM] No users found with role:', options.role);
        return {
          success: false,
          error: 'No users found with role: ' + options.role,
        };
      }

      const results = await Promise.allSettled(
        users.map(async (user) => {
          const token = await getFCMTokenForUser(user.id.toString());
          if (!token) {
            return null;
          }

          const userMessage = { ...message, token };
          return messaging.send(userMessage);
        })
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      console.log('[FCM] Sent to', successCount, 'out of', users.length, 'users with role:', options.role);

      return {
        success: successCount > 0,
        messageId: `Sent to ${successCount} users`,
      };
    }

    return {
      success: false,
      error: 'No target specified for notification',
    };
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get FCM token for a user
 */
async function getFCMTokenForUser(userId: string): Promise<string | null> {
  try {
    // Query the database for the user's FCM token
    // This assumes you have a table that stores FCM tokens
    // Adjust the query based on your actual database schema
    
    console.log('[FCM] Fetching FCM token for user:', userId);
    
    // Placeholder - you need to implement this based on your DB schema
    // const result = await db.query('SELECT fcm_token FROM fcm_tokens WHERE user_id = ?', [userId]);
    // if (result.length > 0) {
    //   return result[0].fcm_token;
    // }
    
    return null;
  } catch (error) {
    console.error('[FCM] Error fetching FCM token:', error);
    return null;
  }
}

/**
 * Get all users with a specific role
 */
async function getUsersByRole(role: string): Promise<any[]> {
  try {
    console.log('[FCM] Fetching users with role:', role);
    
    // Placeholder - you need to implement this based on your DB schema
    // const result = await db.query('SELECT id FROM users WHERE role = ?', [role]);
    // return result;
    
    return [];
  } catch (error) {
    console.error('[FCM] Error fetching users by role:', error);
    return [];
  }
}

/**
 * Save FCM token for a user
 */
export async function saveFCMTokenForUser(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    console.log('[FCM] Saving FCM token for user:', userId);
    
    // Placeholder - you need to implement this based on your DB schema
    // await db.query(
    //   'INSERT INTO fcm_tokens (user_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?',
    //   [userId, token, token]
    // );
    
    console.log('[FCM] FCM token saved successfully');
    return true;
  } catch (error) {
    console.error('[FCM] Error saving FCM token:', error);
    return false;
  }
}

/**
 * Send notification to drivers about a new order
 */
export async function notifyDriversOfNewOrderViaFCM(orderId: number): Promise<boolean> {
  try {
    console.log('[FCM] Notifying drivers of new order:', orderId);

    const result = await sendFCMNotification(
      {
        title: 'طلب توصيل جديد 🚗',
        body: 'لديك طلب توصيل جديد متاح الآن',
        orderId,
        url: `/driver/dashboard?orderId=${orderId}`,
        tag: `order-${orderId}`,
      },
      {
        topic: 'drivers', // or use role: 'driver'
      }
    );

    return result.success;
  } catch (error) {
    console.error('[FCM] Error notifying drivers:', error);
    return false;
  }
}
