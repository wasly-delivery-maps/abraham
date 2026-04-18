/**
 * Firebase Cloud Messaging Service Worker (Updated for reliability)
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "dummy",
  projectId: "wasly-app-fcm",
  messagingSenderId: "716585941091",
  appId: "dummy"
});

const messaging = firebase.messaging();

/**
 * Handle Firebase messages in the background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM-SW] Background message received:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'طلب جديد من Wasly';
  const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد بانتظارك';
  
  const options = {
    body: body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: payload.data?.tag || 'fcm-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/driver/dashboard',
    }
  };

  console.log('[FCM-SW] FORCING notification display:', title);
  return self.registration.showNotification(title, options);
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/driver/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Standard SW listeners
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
