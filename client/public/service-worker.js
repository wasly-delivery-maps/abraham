// Service Worker for handling push notifications and system notifications
// This worker ensures notifications are delivered even when the app is closed

// Global audio context for playing continuous alert sounds
let audioContext = null;
let currentAudioSource = null;
let alertIntervalId = null;

// Initialize audio context for playing sounds
function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[ServiceWorker] Audio context initialized');
    } catch (error) {
      console.error('[ServiceWorker] Failed to initialize audio context:', error);
    }
  }
  return audioContext;
}

// Play alert sound continuously
async function playAlertSound() {
  try {
    const response = await fetch('/alert.mp3');
    const arrayBuffer = await response.arrayBuffer();
    
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (required for user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Decode audio data
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    
    // Stop any existing playback
    if (currentAudioSource) {
      currentAudioSource.stop();
    }
    
    // Create and play the sound
    currentAudioSource = ctx.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(ctx.destination);
    currentAudioSource.start(0);
    
    console.log('[ServiceWorker] Alert sound started');
  } catch (error) {
    console.error('[ServiceWorker] Failed to play alert sound:', error);
  }
}

// Start continuous alert loop (plays every 3 seconds)
function startContinuousAlert() {
  console.log('[ServiceWorker] Starting continuous alert');
  
  // Play immediately
  playAlertSound();
  
  // Then repeat every 3 seconds
  if (alertIntervalId) clearInterval(alertIntervalId);
  alertIntervalId = setInterval(() => {
    playAlertSound();
  }, 3000);
}

// Stop continuous alert
function stopContinuousAlert() {
  console.log('[ServiceWorker] Stopping continuous alert');
  
  if (alertIntervalId) {
    clearInterval(alertIntervalId);
    alertIntervalId = null;
  }
  
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
    } catch (error) {
      console.error('[ServiceWorker] Error stopping audio:', error);
    }
    currentAudioSource = null;
  }
}

// Handle push events - main entry point for push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');
  
  if (!event.data) {
    console.warn('[ServiceWorker] Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    
    // Ensure we have required fields
    const title = data.title || 'طلب جديد من Wasly';
    const body = data.body || 'لديك إشعار جديد';
    
    const options = {
      body: body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: data.tag || `notification-${Date.now()}`,
      requireInteraction: true, // Keep notification visible until user interacts
      vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500], // Stronger vibration pattern
      timestamp: Date.now(),
      dir: 'rtl',
      lang: 'ar',
      renotify: true, // Notify user even if notification with same tag exists
      silent: false,
      // Critical for lock screen visibility
      visibility: 'public',
      data: {
        url: data.url || '/driver/dashboard',
        orderId: data.orderId,
        orderData: data.orderData,
        timestamp: Date.now(),
      },
      // Action buttons for the notification
      actions: [
        {
          action: 'view',
          title: 'عرض الطلب',
        },
        {
          action: 'dismiss',
          title: 'تجاهل',
        }
      ]
    };

    console.log('[ServiceWorker] Showing notification:', title);
    
    // Start continuous alert sound for critical notifications (new orders)
    if (data.tag && data.tag.includes('order')) {
      console.log('[ServiceWorker] Critical notification detected - starting continuous alert');
      startContinuousAlert();
    }
    
    event.waitUntil(
      self.registration.showNotification(title, options)
        .then(() => {
          console.log('[ServiceWorker] Notification shown successfully');
        })
        .catch((error) => {
          console.error('[ServiceWorker] Failed to show notification:', error);
        })
    );
  } catch (error) {
    console.error('[ServiceWorker] Error handling push notification:', error);
    
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
      console.error('[ServiceWorker] Fallback notification also failed:', fallbackError);
    }
  }
});

// Handle notification click - open app or focus existing window
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  // Stop continuous alert when user interacts with notification
  stopContinuousAlert();

  const urlToOpen = event.notification.data.url || '/driver/dashboard';
  const orderId = event.notification.data.orderId;

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          client.focus();
          // Send message to client about the notification action
          client.postMessage({
            type: 'notification-clicked',
            orderId: orderId,
            action: event.action,
          });
          return client;
        }
      }
      
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).then((client) => {
          if (client) {
            client.postMessage({
              type: 'notification-clicked',
              orderId: orderId,
              action: event.action,
            });
          }
          return client;
        });
      }
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle stop alert message from client
  if (event.data && event.data.type === 'STOP_ALERT') {
    console.log('[ServiceWorker] Received stop alert message');
    stopContinuousAlert();
  }
  
  // Handle start alert message from client
  if (event.data && event.data.type === 'START_ALERT') {
    console.log('[ServiceWorker] Received start alert message');
    startContinuousAlert();
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activated');
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed');
  self.skipWaiting();
});
