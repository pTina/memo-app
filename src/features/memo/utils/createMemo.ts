import type { Memo } from '@/shared/types';

export function createMemo(defaultFontId: string | null): Memo {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    content: { type: 'doc', content: [] },
    plainText: '',
    fontId: defaultFontId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
