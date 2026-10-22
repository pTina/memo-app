import type { ReactNode } from 'react';
import { LoginPage } from '@/pages/LoginPage';
import { usesCloudStorage } from '@/shared/lib/firebase';
import { useAuth, useAuthListener } from '../hooks/useAuth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const ready = useAuthListener();
  const { data: user } = useAuth();

  if (!usesCloudStorage()) return children;
  if (!ready) {
    return (
      <main className="relative z-10 min-h-full bg-canvas px-4 py-8 text-sm text-muted">
        로그인 상태를 확인하는 중입니다.
      </main>
    );
  }
  if (!user) return <LoginPage />;
  return children;
}