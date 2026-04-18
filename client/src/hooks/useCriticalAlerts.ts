import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage critical audio alerts for drivers
 * Communicates with Service Worker to control alert sounds
 */
export function useCriticalAlerts() {
  const swRef = useRef<ServiceWorkerContainer | null>(null);
  const isAlertActiveRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Get Service Worker reference
    if ('serviceWorker' in navigator) {
      swRef.current = navigator.serviceWorker;
    }
  }, []);

  /**
   * Start playing continuous alert sound
   */
  const startAlert = useCallback(async () => {
    try {
      if (isAlertActiveRef.current) {
        console.log('[CriticalAlerts] Alert already active');
        return;
      }

      console.log('[CriticalAlerts] Starting alert');
      isAlertActiveRef.current = true;

      // Send message to Service Worker to start alert
      if (swRef.current?.controller) {
        swRef.current.controller.postMessage({
          type: 'START_ALERT',
        });
      }

      // Also try to play sound in the main thread as fallback
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/alert.mp3');
          audioRef.current.loop = true;
          audioRef.current.volume = 1;
        }
        await audioRef.current.play();
        console.log('[CriticalAlerts] Alert sound playing in main thread');
      } catch (error) {
        console.error('[CriticalAlerts] Failed to play sound in main thread:', error);
      }
    } catch (error) {
      console.error('[CriticalAlerts] Failed to start alert:', error);
      isAlertActiveRef.current = false;
    }
  }, []);

  /**
   * Stop playing alert sound
   */
  const stopAlert = useCallback(async () => {
    try {
      if (!isAlertActiveRef.current) {
        console.log('[CriticalAlerts] Alert not active');
        return;
      }

      console.log('[CriticalAlerts] Stopping alert');
      isAlertActiveRef.current = false;

      // Send message to Service Worker to stop alert
      if (swRef.current?.controller) {
        swRef.current.controller.postMessage({
          type: 'STOP_ALERT',
        });
      }

      // Stop all audio elements
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });

      console.log('[CriticalAlerts] Alert stopped');
    } catch (error) {
      console.error('[CriticalAlerts] Failed to stop alert:', error);
    }
  }, []);

  /**
   * Check if alert is currently active
   */
  const isAlertActive = useCallback(() => {
    return isAlertActiveRef.current;
  }, []);

  return {
    startAlert,
    stopAlert,
    isAlertActive,
  };
}
