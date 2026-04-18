/**
 * Firebase Cloud Messaging Service Worker - Fixed Version
 * 
 * This service worker handles background messages from Firebase Cloud Messaging
 * and ensures they are shown as system notifications.
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js');

// Global variables for alert sound management
let audioContext = null;
let currentAudioSource = null;
let alertIntervalId = null;

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
      console.warn('[FCM-SW] Alert sound file not found');
      return;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const ctx = initAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    if (currentAudioSource) {
      try { currentAudioSource.stop(); } catch (e) {}
    }
    
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
  playAlertSound();
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
    try { currentAudioSource.stop(); } catch (error) {}
    currentAudioSource = null;
  }
}

/**
 * Handle Firebase messages in the background
 */
if (typeof firebase !== 'undefined' && firebase.messaging) {
  // Use default configuration if not initialized
  if (!firebase.apps.length) {
    firebase.initializeApp({
      messagingSenderId: "716585941091" // From your Railway variables
    });
  }

  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Background message received:', payload);
    
    const title = payload.notification?.title || payload.data?.title || 'تنبيه من Wasly';
    const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد';
    const icon = payload.notification?.icon || payload.data?.icon || '/logo.jpg';
    const tag = payload.data?.tag || 'fcm-notification';
    const orderId = payload.data?.orderId;

    const options = {
      body,
      icon,
      badge: '/logo.jpg',
      tag,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        orderId,
        url: payload.data?.url || '/driver/dashboard',
      },
      actions: [
        { action: 'accept', title: 'قبول الطلب' },
        { action: 'dismiss', title: 'تجاهل' }
      ]
    };

    // Start alert for critical notifications (new orders)
    if (tag && tag.includes('order')) {
      startContinuousAlert();
    }
    
    return self.registration.showNotification(title, options);
  });
}

/**
 * Handle push events (generic fallback)
 */
self.addEventListener('push', (event) => {
  console.log('[FCM-SW] Generic Push event received');
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.notification?.title || data.data?.title || 'تنبيه من Wasly';
      const options = {
        body: data.notification?.body || data.data?.body || 'لديك إشعار جديد',
        icon: '/logo.jpg',
        tag: data.data?.tag || 'push-notification',
        requireInteraction: true,
        data: { url: data.data?.url || '/driver/dashboard' }
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.log('[FCM-SW] Raw text push:', event.data.text());
    }
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  stopContinuousAlert();

  const urlToOpen = event.notification.data.url || '/driver/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});

self.addEventListener('notificationclose', () => {
  stopContinuousAlert();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'STOP_ALERT') stopContinuousAlert();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});
