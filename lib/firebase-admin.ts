/**
 * Firebase Admin SDK — SOLO SERVER
 * Este archivo NUNCA se importa desde componentes del cliente.
 * Se usa exclusivamente en API routes (app/api/) y Server Components.
 */
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import '@/lib/env'; // Validates env vars on server startup

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  // Opción 1: Service Account JSON (recomendado para producción)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Opción 2: Application Default Credentials (GCP / Firebase Hosting)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const app = getAdminApp();
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminStorage = getStorage(app);

export { adminDb, adminAuth, adminStorage, FieldValue, Timestamp };
