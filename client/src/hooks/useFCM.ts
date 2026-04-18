/**
 * Hook for managing Firebase Cloud Messaging (FCM)
 * Handles initialization, token management, and message handling
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  initializeFirebaseMessaging,
  requestNotificationPermissionAndGetToken,
  getFCMToken,
  handleForegroundMessages,
  saveFCMTokenToBackend,
  isFCMAvailable,
} from '@/lib/firebase-messaging';
import { useCriticalAlerts } from './useCriticalAlerts';

interface UseFCMOptions {
  userId?: string;
  onMessageReceived?: (payload: any) => void;
}

export function useFCM(options: UseFCMOptions = {}) {
  const { userId, onMessageReceived } = options;
  const { startAlert, stopAlert } = useCriticalAlerts();
  const [isInitialized, setIsInitialized] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const initRef = useRef(false);

  // Initialize FCM on component mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      try {
        console.log('[useFCM] Starting FCM initialization');

        // Check if FCM is available
        const available = await isFCMAvailable();
        setIsSupported(available);

        if (!available) {
          console.warn('[useFCM] FCM is not available in this environment');
          return;
        }

        // Initialize Firebase Messaging
        const initialized = await initializeFirebaseMessaging();
        if (!initialized) {
          console.warn('[useFCM] Failed to initialize Firebase Messaging');
          return;
        }

        setIsInitialized(true);
        console.log('[useFCM] Firebase Messaging initialized successfully');

        // Try to get existing token
        const token = await getFCMToken();
        if (token) {
          console.log('[useFCM] Got existing FCM token');
          setFcmToken(token);

          // Save token to backend if userId is provided
          if (userId) {
            await saveFCMTokenToBackend(token, userId);
          }
        }

        // Set up foreground message handler
        handleForegroundMessages((payload) => {
          console.log('[useFCM] Foreground message received:', payload);

          // Start alert for critical notifications
          if (payload.data?.tag?.includes('order')) {
            startAlert();
          }

          // Call custom callback if provided
          if (onMessageReceived) {
            onMessageReceived(payload);
          }
        });
      } catch (error) {
        console.error('[useFCM] Error during initialization:', error);
      }
    };

    initialize();
  }, [userId, onMessageReceived, startAlert]);

  // Request notification permission and get token
  const requestPermissionAndGetToken = useCallback(async () => {
    try {
      console.log('[useFCM] Requesting notification permission');

      const token = await requestNotificationPermissionAndGetToken();
      if (!token) {
        console.warn('[useFCM] Failed to get FCM token');
        return null;
      }

      setFcmToken(token);

      // Save token to backend if userId is provided
      if (userId) {
        const saved = await saveFCMTokenToBackend(token, userId);
        if (!saved) {
          console.warn('[useFCM] Failed to save token to backend');
        }
      }

      return token;
    } catch (error) {
      console.error('[useFCM] Error requesting permission:', error);
      return null;
    }
  }, [userId]);

  // Stop alert
  const stopAlertSound = useCallback(async () => {
    try {
      await stopAlert();
    } catch (error) {
      console.error('[useFCM] Error stopping alert:', error);
    }
  }, [stopAlert]);

  return {
    isInitialized,
    isSupported,
    fcmToken,
    requestPermissionAndGetToken,
    stopAlertSound,
  };
}
