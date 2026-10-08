export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type SortBy = 'createdAt' | 'updatedAt';

export type Settings = {
  theme: ThemePreference;
  defaultFontId: string | null;
  dateWithTime: boolean;
  sortBy: SortBy;
  secretCheck: boolean;
};

export const defaultSettings: Settings = {
  theme: 'system',
  defaultFontId: null,
  dateWithTime: false,
  sortBy: 'createdAt',
  secretCheck: true,
};
