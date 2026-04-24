/**
 * Service Worker Registration Module
 * Handles registration and updates of the Service Worker
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker not supported in this browser');
    return false;
  }

  try {
    console.log('[SW] Starting Service Worker registration...');

    // Register the standard Service Worker
    const timestamp = new Date().getTime();
    const swUrl = `/sw.js?v=${timestamp}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Service Worker registered successfully:', registration);
    return true;
  } catch (error) {
    console.error('[SW] Failed to register Service Worker:', error);
    return false;
  }
}

export async function unregisterOldServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  } catch (error) {
    console.error('[SW] Error unregistering old Service Workers:', error);
  }
}

export async function checkServiceWorkerStatus(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.length > 0;
  } catch (error) {
    return false;
  }
}
