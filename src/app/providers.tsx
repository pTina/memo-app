import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { useFontFace } from '@/features/font/hooks/useFontFace';
import { useFonts } from '@/features/font/hooks/useFonts';
import { memoApi } from '@/features/memo/api/memoApi';
import { queryClient } from '@/shared/lib/queryClient';

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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PurgeExpired />
      <RegisterFonts />
      {children}
    </QueryClientProvider>
  );
}
