/**
 * Firebase Admin SDK Configuration
 * 
 * This file initializes Firebase Admin SDK for sending notifications from the backend
 * 
 * To set up Firebase Admin SDK:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Go to Project Settings > Service Accounts tab
 * 3. Click "Generate New Private Key"
 * 4. Save the JSON file and add its contents to your .env file as FIREBASE_SERVICE_ACCOUNT_KEY
 */

import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebaseAdmin(): boolean {
  try {
    // Check if already initialized
    if (adminApp) {
      console.log('[Firebase Admin] Already initialized');
      return true;
    }

    // Get service account key from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
      return false;
    }

    // Parse the service account key
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (error) {
      console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      return false;
    }

    // Initialize Firebase Admin SDK
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[Firebase Admin] Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): admin.app.App | null {
  if (!adminApp) {
    console.warn('[Firebase Admin] Firebase Admin SDK not initialized');
  }
  return adminApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) {
    return null;
  }
  return admin.messaging(app);
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseAdminConfigured(): boolean {
  return !!adminApp;
}
