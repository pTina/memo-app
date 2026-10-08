import type { FontFile, Memo, Settings } from '@/shared/types';

export type StorageAdapter = {
  listMemos(): Promise<Memo[]>;
  getMemo(id: string): Promise<Memo | null>;
  saveMemo(memo: Memo): Promise<void>;
  removeMemos(ids: string[]): Promise<void>;
  listFonts(): Promise<FontFile[]>;
  saveFont(font: FontFile): Promise<void>;
  deleteFont(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
};
