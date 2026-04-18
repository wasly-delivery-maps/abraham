/**
 * Firebase Cloud Messaging (FCM) Handler
 * This module handles all FCM operations including:
 * - Initializing Firebase
 * - Requesting notification permissions
 * - Getting FCM tokens
 * - Handling foreground messages
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { firebaseConfig, firebaseVapidKey, validateFirebaseConfig } from './firebase-config';
import { registerServiceWorker, unregisterOldServiceWorkers, checkServiceWorkerStatus } from './service-worker-register';

let messaging: any = null;
let isInitialized = false;

/**
 * Initialize Firebase and FCM
 */
export async function initializeFirebaseMessaging() {
  try {
    // Validate configuration first
    if (!validateFirebaseConfig()) {
      console.warn('[FCM] Firebase configuration is incomplete. Please add environment variables.');
      return false;
    }

    // Check if FCM is supported in this browser
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Firebase Cloud Messaging is not supported in this browser');
      return false;
    }

    // Clean up old Service Workers first
    console.log('[FCM] Cleaning up old Service Workers...');
    await unregisterOldServiceWorkers();

    // Register new Service Worker aggressively
    console.log('[FCM] Registering new Service Worker...');
    const swRegistered = await registerServiceWorker();
    if (!swRegistered) {
      console.warn('[FCM] Failed to register Service Worker, but continuing...');
    }

    // Check Service Worker status
    const swActive = await checkServiceWorkerStatus();
    console.log('[FCM] Service Worker active:', swActive);

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    console.log('[FCM] Firebase app initialized');

    // Get messaging instance
    messaging = getMessaging(app);
    console.log('[FCM] Firebase Messaging initialized');

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[FCM] Failed to initialize Firebase Messaging:', error);
    return false;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  try {
    if (!isInitialized) {
      const initialized = await initializeFirebaseMessaging();
      if (!initialized) {
        return null;
      }
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('[FCM] Notification permission:', permission);

    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
    });

    if (!token) {
      console.error('[FCM] Failed to get FCM token');
      return null;
    }

    console.log('[FCM] FCM Token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('[FCM] Error requesting notification permission or getting token:', error);
    return null;
  }
}

/**
 * Get current FCM token (if already obtained)
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!isInitialized) {
      const initialized = await initializeFirebaseMessaging();
      if (!initialized) {
        return null;
      }
    }

    // Check if notification permission is already granted
    if (Notification.permission !== 'granted') {
      console.log('[FCM] Notification permission not granted');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
    });

    return token || null;
  } catch (error) {
    console.error('[FCM] Error getting FCM token:', error);
    return null;
  }
}

/**
 * Handle foreground messages (when app is open)
 */
export function handleForegroundMessages(
  callback: (payload: any) => void
) {
  try {
    if (!isInitialized) {
      console.warn('[FCM] Firebase Messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('[FCM] Error setting up foreground message handler:', error);
  }
}

/**
 * Save FCM token to backend
 */
export async function saveFCMTokenToBackend(
  token: string,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/fcm/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
      }),
    });

    if (!response.ok) {
      console.error('[FCM] Failed to save token to backend:', response.statusText);
      return false;
    }

    console.log('[FCM] Token saved to backend successfully');
    return true;
  } catch (error) {
    console.error('[FCM] Error saving token to backend:', error);
    return false;
  }
}

/**
 * Check if FCM is supported and configured
 */
export async function isFCMAvailable(): Promise<boolean> {
  try {
    const supported = await isSupported();
    const configured = validateFirebaseConfig();
    return supported && configured;
  } catch (error) {
    console.error('[FCM] Error checking FCM availability:', error);
    return false;
  }
}
