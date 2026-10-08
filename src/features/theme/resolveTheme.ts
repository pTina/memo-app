import type { ResolvedTheme, ThemePreference } from '@/shared/types';

export function resolveTheme(theme: ThemePreference, prefersDark?: boolean): ResolvedTheme {
  if (theme === 'light' || theme === 'dark') return theme;
  if (prefersDark != null) return prefersDark ? 'dark' : 'light';
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
