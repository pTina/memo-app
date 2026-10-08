import type { Memo } from '@/shared/types';

export const TRASH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function daysUntilPurge(deletedAt: string, now = Date.now()): number {
  const deleted = Date.parse(deletedAt);
  if (Number.isNaN(deleted)) return 0;
  const remain = deleted + TRASH_TTL_MS - now;
  if (remain <= 0) return 0;
  return Math.ceil(remain / (24 * 60 * 60 * 1000));
}

export function purgeExpired(memos: Memo[], now = Date.now()): { keep: Memo[]; removedIds: string[] } {
  const removedIds: string[] = [];
  const keep = memos.filter((memo) => {
    if (!memo.deletedAt) return true;
    const deletedAt = Date.parse(memo.deletedAt);
    if (Number.isNaN(deletedAt) || now - deletedAt < TRASH_TTL_MS) return true;
    removedIds.push(memo.id);
    return false;
  });
  return { keep, removedIds };
}
