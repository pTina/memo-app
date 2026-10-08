import type { Memo } from '@/shared/types';

export function searchMemos(memos: Memo[], query: string): Memo[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return memos;
  return memos.filter((memo) => (
    memo.title.toLowerCase().includes(needle) || memo.plainText.toLowerCase().includes(needle)
  ));
}

export function activeMemos(memos: Memo[]): Memo[] {
  return memos.filter((memo) => memo.deletedAt == null);
}
