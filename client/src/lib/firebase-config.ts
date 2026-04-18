/**
 * Firebase Configuration
 * This file contains the Firebase configuration needed for FCM (Firebase Cloud Messaging)
 * 
 * To get these values:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Create a new project or select an existing one
 * 3. Go to Project Settings (gear icon)
 * 4. Copy the configuration from "Your apps" section
 * 5. Add these values to your .env.local file
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/**
 * VAPID Key for Web Push
 * This key is used to authenticate your web app with Firebase Cloud Messaging
 * 
 * To get this key:
 * 1. Go to Firebase Console
 * 2. Go to Project Settings > Cloud Messaging tab
 * 3. Copy the "Server public key" (VAPID key)
 * 4. Add it to your .env.local as VITE_FIREBASE_VAPID_KEY
 */
export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Validate Firebase configuration
 */
export function validateFirebaseConfig(): boolean {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field as keyof typeof firebaseConfig]
  );

  if (missingFields.length > 0) {
    console.warn(
      '[Firebase] Missing configuration fields:',
      missingFields.join(', ')
    );
    return false;
  }

  if (!firebaseVapidKey) {
    console.warn('[Firebase] VAPID key is not configured');
    return false;
  }

  return true;
}
