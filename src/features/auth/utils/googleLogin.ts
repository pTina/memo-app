import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, type UserCredential } from 'firebase/auth';
import { getFirebaseAuth, usesAuthEmulator } from '@/shared/lib/firebase';

let redirectResult: Promise<UserCredential | null> | null = null;

export function loginErrorMessage(error: unknown) {
  if (usesAuthEmulator()) {
    return '지금은 Auth 에뮬레이터에 연결되어 실제 Google 로그인을 쓸 수 없습니다. npm run dev 로 실행해 주세요.';
  }
  if (!(error instanceof FirebaseError)) {
    const text = error instanceof Error ? error.message : '';
    if (text.includes('CONFIGURATION_NOT_FOUND')) {
      return 'Firebase Authentication이 아직 설정되지 않았습니다. 콘솔에서 Authentication을 시작하고 Google 로그인을 켜 주세요.';
    }
    return 'Google 로그인에 실패했습니다.';
  }
  if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') return '';
  if (error.code === 'auth/popup-blocked') return '팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.';
  if (error.code === 'auth/unauthorized-domain') return '이 도메인은 Firebase 승인된 도메인에 없습니다. localhost를 추가해 주세요.';
  if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found' || error.message.includes('CONFIGURATION_NOT_FOUND')) {
    return 'Firebase Authentication이 아직 설정되지 않았습니다. 콘솔에서 Authentication을 시작하고 Google 로그인을 켜 주세요.';
  }
  if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
    return 'Firebase API 키가 올바르지 않습니다. .env.local 값을 확인해 주세요.';
  }
  return 'Google 로그인에 실패했습니다.';
}

export function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export async function startGoogleLogin() {
  const auth = getFirebaseAuth();
  const provider = googleProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw error;
  }
}

export function finishGoogleRedirect() {
  if (!redirectResult) redirectResult = getRedirectResult(getFirebaseAuth());
  return redirectResult;
}