import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

let emulatorsBound = false;
let authInstance: Auth | undefined;

function envText(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

export function usesEmulator() {
  return envText(import.meta.env.VITE_USE_EMULATOR) === 'true';
}

export function usesAuthEmulator() {
  return import.meta.env.DEV && envText(import.meta.env.VITE_USE_AUTH_EMULATOR) === 'true';
}

export function usesCloudStorage() {
  if (usesEmulator() || usesAuthEmulator()) return true;
  const key = envText(import.meta.env.VITE_FIREBASE_API_KEY);
  return Boolean(key && key !== 'demo');
}

function config() {
  return {
    apiKey: envText(import.meta.env.VITE_FIREBASE_API_KEY) || 'demo',
    authDomain: envText(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || 'demo-memo-app.firebaseapp.com',
    projectId: envText(import.meta.env.VITE_FIREBASE_PROJECT_ID) || 'demo-memo-app',
    storageBucket: envText(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || 'demo-memo-app.appspot.com',
    messagingSenderId: envText(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '0',
    appId: envText(import.meta.env.VITE_FIREBASE_APP_ID) || 'demo',
  };
}

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config());
}

function bindEmulators(auth: Auth, db: Firestore) {
  if (emulatorsBound || !import.meta.env.DEV) return;
  if (usesAuthEmulator()) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  if (usesEmulator()) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  emulatorsBound = usesAuthEmulator() || usesEmulator();
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!authInstance) {
    try {
      authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } catch {
      authInstance = getAuth(app);
    }
  }
  bindEmulators(authInstance, getFirestore(app));
  return authInstance;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();
  const db = getFirestore(app);
  bindEmulators(getFirebaseAuth(), db);
  return db;
}