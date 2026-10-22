import { purgeExpired } from '@/features/trash/utils/purgeExpired';
import { storage } from '@/shared/storage';
import type { Memo, SortBy } from '@/shared/types';
import { activeMemos, searchMemos } from '../utils/searchMemos';
import { sortMemos } from '../utils/sortMemos';

export const memoApi = {
  async listActive(sortBy: SortBy, query: string): Promise<Memo[]> {
    const memos = await storage.listMemos();
    return searchMemos(sortMemos(activeMemos(memos), sortBy), query);
  },

  get(id: string): Promise<Memo | null> {
    return storage.getMemo(id);
  },

  async save(memo: Memo): Promise<Memo> {
    await storage.saveMemo(memo);
    return (await storage.getMemo(memo.id)) ?? memo;
  },

  async softDelete(id: string): Promise<Memo | null> {
    const memo = await storage.getMemo(id);
    if (!memo || memo.deletedAt) return memo;
    const next = { ...memo, deletedAt: new Date().toISOString() };
    await storage.saveMemo(next);
    return next;
  },

  async softDeleteMany(ids: string[]): Promise<Memo[]> {
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    const memos = await storage.listMemos();
    const next = memos.filter((memo) => idSet.has(memo.id) && memo.deletedAt == null)
      .map((memo) => ({ ...memo, deletedAt: now }));
    await Promise.all(next.map((memo) => storage.saveMemo(memo)));
    return next;
  },

  async listTrash(): Promise<Memo[]> {
    const memos = await storage.listMemos();
    return memos
      .filter((memo) => memo.deletedAt != null)
      .sort((a, b) => (a.deletedAt! < b.deletedAt! ? 1 : a.deletedAt! > b.deletedAt! ? -1 : 0));
  },

  async restore(id: string): Promise<Memo | null> {
    const memo = await storage.getMemo(id);
    if (!memo) return null;
    const next = { ...memo, deletedAt: null };
    await storage.saveMemo(next);
    return next;
  },

  remove(ids: string[]): Promise<void> {
    return storage.removeMemos(ids);
  },

  async emptyTrash(): Promise<string[]> {
    const memos = await storage.listMemos();
    const ids = memos.filter((memo) => memo.deletedAt != null).map((memo) => memo.id);
    await storage.removeMemos(ids);
    return ids;
  },

  async purgeExpiredMemos(now = Date.now()): Promise<boolean> {
    const memos = await storage.listMemos();
    const { removedIds } = purgeExpired(memos, now);
    if (removedIds.length === 0) return false;
    await storage.removeMemos(removedIds);
    return true;
  },
};
