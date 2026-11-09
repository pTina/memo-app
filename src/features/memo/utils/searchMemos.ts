import type { MemoSummary } from '@/shared/types';

export function searchMemos<T extends MemoSummary>(memos: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return memos;
  return memos.filter((memo) => (
    memo.title.toLowerCase().includes(needle) || memo.plainText.toLowerCase().includes(needle)
  ));
}

export function activeMemos<T extends MemoSummary>(memos: T[]): T[] {
  return memos.filter((memo) => memo.deletedAt == null);
}
