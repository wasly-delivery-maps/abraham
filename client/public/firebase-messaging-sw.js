/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker handles:
 * - Background messages from Firebase Cloud Messaging
 * - Playing critical alert sounds
 * - Showing notifications
 * - Handling notification clicks
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js');

// Global variables for alert sound management
let audioContext = null;
let currentAudioSource = null;
let alertIntervalId = null;
let lastNotificationTime = 0;

/**
 * Initialize audio context for playing sounds
 */
function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (self.AudioContext || self.webkitAudioContext)();
      console.log('[FCM-SW] Audio context initialized');
    } catch (error) {
      console.error('[FCM-SW] Failed to initialize audio context:', error);
    }
  }
  return audioContext;
}

/**
 * Play alert sound using Web Audio API
 */
async function playAlertSound() {
  try {
    const response = await fetch('/alert.mp3');
    if (!response.ok) {
      console.warn('[FCM-SW] Alert sound file not found, using fallback');
      return;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Decode audio data
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // Stop any existing playback
    if (currentAudioSource) {
      try {
        currentAudioSource.stop();
      } catch (e) {
        // Already stopped
      }
    }
    
    // Create and play the sound
    currentAudioSource = ctx.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(ctx.destination);
    currentAudioSource.start(0);
    
    console.log('[FCM-SW] Alert sound played');
  } catch (error) {
    console.error('[FCM-SW] Failed to play alert sound:', error);
  }
}

/**
 * Start continuous alert loop
 */
function startContinuousAlert() {
  console.log('[FCM-SW] Starting continuous alert');
  
  // Play immediately
  playAlertSound();
  
  // Then repeat every 3 seconds
  if (alertIntervalId) clearInterval(alertIntervalId);
  alertIntervalId = setInterval(() => {
    playAlertSound();
  }, 3000);
}

/**
 * Stop continuous alert
 */
function stopContinuousAlert() {
  console.log('[FCM-SW] Stopping continuous alert');
  
  if (alertIntervalId) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
  
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (error) {
      console.error('[FCM-SW] Error stopping audio:', error);
    }
    currentAudioSource = null;
  }
}

/**
 * Handle Firebase messages in the background
 */
if (typeof firebase !== 'undefined' && firebase.messaging) {
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Background message received:', payload);
    
    const title = payload.notification?.title || 'طلب جديد من Wasly';
    const body = payload.notification?.body || 'لديك إشعار جديد';
    const icon = payload.notification?.icon || '/logo.jpg';
    const badge = payload.notification?.badge || '/logo.jpg';
    const tag = payload.data?.tag || 'fcm-notification';
    const orderId = payload.data?.orderId;

    const options = {
      body,
      icon,
      badge,
      tag,
      requireInteraction: true,
      visibility: 'public',
      data: {
        orderId,
        url: payload.data?.url || '/driver/dashboard',
      },
      actions: [
        {
          action: 'accept',
          title: 'قبول الطلب',
        },
        {
          action: 'dismiss',
          title: 'تجاهل',
        }
      ]
    };

    console.log('[FCM-SW] Showing notification:', title);
    
    // Start continuous alert for critical notifications (new orders)
    if (tag && tag.includes('order')) {
      console.log('[FCM-SW] Critical notification detected - starting continuous alert');
      startContinuousAlert();
    }
    
    return self.registration.showNotification(title, options)
      .then(() => {
        console.log('[FCM-SW] Notification shown successfully');
      })
      .catch((error) => {
        console.error('[FCM-SW] Failed to show notification:', error);
      });
  });
}

/**
 * Handle push events (for web push protocol)
 */
self.addEventListener('push', (event) => {
  console.log('[FCM-SW] Push event received');
  
  if (!event.data) {
    console.warn('[FCM-SW] Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[FCM-SW] Push data:', data);
    
    const title = data.notification?.title || 'طلب جديد من Wasly';
    const body = data.notification?.body || 'لديك إشعار جديد';
    const icon = data.notification?.icon || '/logo.jpg';
    const badge = data.notification?.badge || '/logo.jpg';
    const tag = data.data?.tag || 'fcm-notification';
    const orderId = data.data?.orderId;

    const options = {
      body,
      icon,
      badge,
      tag,
      requireInteraction: true,
      visibility: 'public',
      data: {
        orderId,
        url: data.data?.url || '/driver/dashboard',
      },
      actions: [
        {
          action: 'accept',
          title: 'قبول الطلب',
        },
        {
          action: 'dismiss',
          title: 'تجاهل',
        }
      ]
    };

    console.log('[FCM-SW] Showing notification:', title);
    
    // Start continuous alert for critical notifications (new orders)
    if (tag && tag.includes('order')) {
      console.log('[FCM-SW] Critical notification detected - starting continuous alert');
      startContinuousAlert();
    }
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[FCM-SW] Notification shown successfully');
        })
        .catch((error) => {
          console.error('[FCM-SW] Failed to show notification:', error);
        })
    );
  } catch (error) {
    console.error('[FCM-SW] Error handling push notification:', error);
    
    // Fallback: show a generic notification if JSON parsing fails
    try {
      const fallbackText = event.data.text();
      event.waitUntil(
        self.registration.showNotification('طلب جديد من Wasly', {
          body: fallbackText || 'لديك إشعار جديد',
          icon: '/logo.jpg',
          badge: '/logo.jpg',
          requireInteraction: true,
          visibility: 'public',
        })
      );
    } catch (fallbackError) {
      console.error('[FCM-SW] Fallback notification also failed:', fallbackError);
    }
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM-SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  // Stop continuous alert when user interacts with notification
  stopContinuousAlert();

  const urlToOpen = event.notification.data.url || '/driver/dashboard';
  const orderId = event.notification.data.orderId;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a window/tab with the target URL open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/**
 * Handle notification dismissal
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM-SW] Notification dismissed:', event.notification.tag);
  
  // Stop continuous alert when notification is dismissed
  stopContinuousAlert();
});

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  console.log('[FCM-SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle stop alert message from client
  if (event.data && event.data.type === 'STOP_ALERT') {
    console.log('[FCM-SW] Received stop alert message');
    stopContinuousAlert();
  }
  
  // Handle start alert message from client
  if (event.data && event.data.type === 'START_ALERT') {
    console.log('[FCM-SW] Received start alert message');
    startContinuousAlert();
  }
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

/**
 * Install event
 */
self.addEventListener('install', (event) => {
  console.log('[FCM-SW] Service Worker installed');
  self.skipWaiting();
});
