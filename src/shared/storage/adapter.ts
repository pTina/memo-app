import type { FontFile, Memo, MemoSummary, Settings } from '@/shared/types';

export type StorageAdapter = {
  listMemos(): Promise<MemoSummary[]>;
  getMemo(id: string): Promise<Memo | null>;
  saveMemo(memo: Memo): Promise<void>;
  patchMemo(id: string, patch: Partial<Pick<MemoSummary, 'deletedAt' | 'updatedAt' | 'fontId'>>): Promise<void>;
  removeMemos(ids: string[]): Promise<void>;
  listFonts(): Promise<FontFile[]>;
  saveFont(font: FontFile): Promise<void>;
  deleteFont(id: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
};
