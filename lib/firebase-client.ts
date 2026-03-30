'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  limit,
  onSnapshot,
  orderBy,
  setDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// FIX #10 + #24 — Lazy-load Analytics (no se carga si no se llama)
export async function getAnalyticsInstance() {
  if (typeof window === 'undefined') return null;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    return getAnalytics(app);
  } catch {
    return null;
  }
}

// FIX #24 — Lazy-load Storage (solo se importa cuando se sube archivo)
export async function getStorageInstance() {
  const { getStorage } = await import('firebase/storage');
  return getStorage(app);
}

export async function uploadToStorage(path: string, file: File) {
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const storage = getStorage(app);
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

// Exportar lo que se necesita de manera estática (Auth + Firestore)
export {
  app, auth, googleProvider,
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, sendPasswordResetEmail,
  db,
  collection, getDocs, getDoc, query, where, doc, limit, onSnapshot, orderBy, setDoc,
};
