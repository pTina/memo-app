import { storage } from '@/shared/storage';
import type { FontFile } from '@/shared/types';

export const fontApi = {
  list(): Promise<FontFile[]> {
    return storage.listFonts();
  },

  save(font: FontFile): Promise<void> {
    return storage.saveFont(font);
  },

  remove(id: string): Promise<void> {
    return storage.deleteFont(id);
  },
};
