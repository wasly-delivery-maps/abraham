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

        // Request notification permission immediately (aggressive approach)
        console.log('[useFCM] Requesting notification permission immediately');
        const token = await requestNotificationPermissionAndGetToken();
        
        if (token) {
          console.log('[useFCM] Got FCM token:', token.substring(0, 20) + '...');
          setFcmToken(token);

          // Save token to backend if userId is provided
          if (userId) {
            console.log('[useFCM] Saving token to backend for user:', userId);
            const saved = await saveFCMTokenToBackend(token, userId);
            if (saved) {
              console.log('[useFCM] Token saved to backend successfully');
            } else {
              console.warn('[useFCM] Failed to save token to backend');
            }
          }
        } else {
          console.warn('[useFCM] Failed to get FCM token');
        }

        // Set up foreground message handler
        handleForegroundMessages((payload) => {
          console.log('[useFCM] Foreground message received:', payload);

          // Start alert for critical notifications
          if (payload.data?.tag?.includes('order')) {
            console.log('[useFCM] Starting critical alert for order');
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

  // Refresh token periodically (every 30 minutes) and on visibility change
  useEffect(() => {
    if (!isInitialized || !userId) return;

    const refreshToken = async () => {
      try {
        console.log('[useFCM] Refreshing FCM token');
        const token = await getFCMToken();
        if (token && token !== fcmToken) {
          console.log('[useFCM] Token changed, updating backend');
          await saveFCMTokenToBackend(token, userId);
          setFcmToken(token);
        }
      } catch (error) {
        console.error('[useFCM] Error refreshing token:', error);
      }
    };

    // Refresh every 30 minutes
    const interval = setInterval(refreshToken, 30 * 60 * 1000);

    // Also refresh when page becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[useFCM] Page became visible, refreshing token');
        refreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, userId, fcmToken]);

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
