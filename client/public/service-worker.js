// Service Worker for handling push notifications
// This worker ensures notifications are delivered even when the app is closed

// Handle push events - main entry point for push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');
  
  if (!event.data) {
    console.warn('[ServiceWorker] Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    
    const title = data.title || 'إشعار جديد من Wasly';
    const body = data.body || 'لديك تحديث جديد في التطبيق';
    
    const options = {
      body: body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: data.tag || `notification-${Date.now()}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      dir: 'rtl',
      lang: 'ar',
      renotify: true,
      visibility: 'public',
      data: {
        url: data.url || '/',
        orderId: data.orderId,
      },
      actions: [
        {
          action: 'view',
          title: 'عرض',
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[ServiceWorker] Error handling push notification:', error);
    const fallbackText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('إشعار من Wasly', {
        body: fallbackText || 'لديك إشعار جديد',
        icon: '/logo.jpg',
        badge: '/logo.jpg',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
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

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});
