import { useEffect } from 'react';
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import type { ThemePreference } from '@/shared/types';
import { useUiStore } from '@/store/useUiStore';
import { resolveTheme } from '../resolveTheme';

export function applyStoredTheme() {
  document.documentElement.dataset.theme = resolveTheme(readSettingsSync().theme);
}

export function useTheme() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  const setResolvedTheme = useUiStore((state) => state.setResolvedTheme);
  const theme = settings?.theme ?? readSettingsSync().theme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = resolveTheme(theme, media.matches);
      document.documentElement.dataset.theme = resolved;
      setResolvedTheme(resolved);
    };
    apply();
    if (theme !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [setResolvedTheme, theme]);

  function setTheme(next: ThemePreference) {
    const current = settings ?? readSettingsSync();
    updateSettings.mutate({ ...current, theme: next });
  }

  return { theme, resolvedTheme, setTheme };
}
