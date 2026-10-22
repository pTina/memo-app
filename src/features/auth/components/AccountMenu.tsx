import { useEffect, useId, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getFirebaseAuth } from '@/shared/lib/firebase';
import { AccountIcon, LogoutIcon } from '@/shared/ui/icons';
import { useAuth } from '../hooks/useAuth';

export function AccountMenu() {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const label = user?.displayName || user?.email || '계정';

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  if (!user) return null;

  async function logout() {
    await signOut(getFirebaseAuth());
    queryClient.clear();
    setOpen(false);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="계정"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex size-10 items-center justify-center rounded-lg text-ink"
        onClick={() => setOpen((value) => !value)}
      >
        <AccountIcon />
      </button>
      {open ? (
        <div id={menuId} className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-line-strong bg-paper p-1 shadow-panel">
          <p className="truncate px-3 py-2 text-sm text-muted">{label}</p>
          <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink" onClick={() => void logout()}>
            <LogoutIcon />
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}