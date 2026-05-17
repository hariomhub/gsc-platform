import admin from 'firebase-admin';
import { env } from './env.js';

if (
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_PRIVATE_KEY.includes('BEGIN')   // must be a real key
) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔔 Firebase Admin initialized');
  } catch (err: any) {
    console.warn('⚠️  Firebase init failed (push notifications disabled):', err.message);
  }
} else {
  console.warn('⚠️  Firebase not configured — push notifications disabled');
}

export default admin;