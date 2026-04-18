/**
 * Service Worker Registration Module
 * Handles aggressive registration and updates of the Service Worker
 * Ensures notifications work even when app is closed
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker not supported in this browser');
    return false;
  }

  try {
    console.log('[SW] Starting Service Worker registration...');

    // Register the new Service Worker with cache busting
    const timestamp = new Date().getTime();
    const swUrl = `/sw-firebase-v2.js?v=${timestamp}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('[SW] Service Worker registered successfully:', registration);

    // Check for updates immediately
    registration.update().catch((error) => {
      console.error('[SW] Error checking for updates:', error);
    });

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[SW] New Service Worker update found');
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New Service Worker installed and ready');
            // Notify the new SW to skip waiting
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service Worker controller changed - new version active');
      // Reload page to use new SW
      window.location.reload();
    });

    return true;
  } catch (error) {
    console.error('[SW] Failed to register Service Worker:', error);
    return false;
  }
}

/**
 * Unregister old Service Workers to clean up
 */
export async function unregisterOldServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[SW] Found ${registrations.length} Service Worker registrations`);

    for (const registration of registrations) {
      // Only unregister if it's not the current one
      const scope = registration.scope;
      if (!scope.includes('sw-firebase-v2')) {
        console.log('[SW] Unregistering old Service Worker:', scope);
        await registration.unregister();
      }
    }
  } catch (error) {
    console.error('[SW] Error unregistering old Service Workers:', error);
  }
}

/**
 * Check Service Worker status
 */
export async function checkServiceWorkerStatus(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker not supported');
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const hasActiveWorker = registrations.some(
      (reg) => reg.active || reg.installing || reg.waiting
    );

    console.log(
      `[SW] Service Worker status: ${hasActiveWorker ? 'Active' : 'Inactive'} (${registrations.length} registrations)`
    );

    return hasActiveWorker;
  } catch (error) {
    console.error('[SW] Error checking Service Worker status:', error);
    return false;
  }
}
