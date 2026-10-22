import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { TestModeBanner } from '@/features/auth/components/TestModeBanner';
import { useAuth, useAuthListener } from '@/features/auth/hooks/useAuth';
import { useFontFace } from '@/features/font/hooks/useFontFace';
import { useFonts } from '@/features/font/hooks/useFonts';
import { memoApi } from '@/features/memo/api/memoApi';
import { SecretWarningDialog } from '@/features/security/components/SecretWarningDialog';
import { queryClient } from '@/shared/lib/queryClient';
import { usesCloudStorage } from '@/shared/lib/firebase';

function PurgeExpired() {
  useEffect(() => {
    let cancelled = false;
    memoApi.purgeExpiredMemos().then((changed) => {
      if (cancelled || !changed) return;
      void queryClient.invalidateQueries({ queryKey: ['memos'] });
      void queryClient.invalidateQueries({ queryKey: ['trash'] });
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

function RegisterFonts() {
  const { data } = useFonts();
  useFontFace(data);
  return null;
}

function CloudReadyEffects() {
  const ready = useAuthListener();
  const { data: user } = useAuth();
  if (usesCloudStorage() && (!ready || !user)) return null;
  return (
    <>
      <PurgeExpired />
      <RegisterFonts />
    </>
  );
}

function AdminSession() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV || import.meta.env.VITE_AUTH_BYPASS !== 'true') return undefined;
    let cancelled = false;
    setShowBanner(true);
    void import('@/features/auth/utils/adminBypass').then(async ({ applyAdminBypass }) => {
      const user = await applyAdminBypass();
      if (cancelled || !user) return;
      const { seedEmulatorIfEmpty } = await import('@/features/auth/utils/seedEmulator');
      await seedEmulatorIfEmpty(user.uid);
      if (cancelled) return;
      void queryClient.invalidateQueries();
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return showBanner ? <TestModeBanner /> : null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSession />
      <RequireAuth>
        <CloudReadyEffects />
        {children}
        <SecretWarningDialog />
      </RequireAuth>
    </QueryClientProvider>
  );
}
