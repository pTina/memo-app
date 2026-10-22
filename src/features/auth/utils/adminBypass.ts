import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/shared/lib/firebase';

const TEST_EMAIL = 'admin@test.local';
const TEST_PASSWORD = 'admin-test';

export function isAdminBypass() {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true';
}

export async function applyAdminBypass(): Promise<User | null> {
  if (!isAdminBypass()) return null;
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  try {
    const created = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    return created.user;
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (code === 'auth/email-already-in-use') {
      const signed = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      return signed.user;
    }
    return null;
  }
}