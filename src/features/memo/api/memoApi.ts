import { purgeExpired } from '@/features/trash/utils/purgeExpired';
import { storage } from '@/shared/storage';
import type { Memo, MemoSummary, SortBy } from '@/shared/types';
import { activeMemos, searchMemos } from '../utils/searchMemos';
import { sortMemos } from '../utils/sortMemos';

export const memoApi = {
  async listActive(sortBy: SortBy, query: string): Promise<MemoSummary[]> {
    const memos = await storage.listMemos();
    return searchMemos(sortMemos(activeMemos(memos), sortBy), query);
  },

  get(id: string): Promise<Memo | null> {
    return storage.getMemo(id);
  },

  async save(memo: Memo): Promise<Memo> {
    await storage.saveMemo(memo);
    const stored = await storage.getMemo(memo.id);
    if (stored && stored.updatedAt >= memo.updatedAt) return stored;
    return memo;
  },

  async softDelete(id: string): Promise<string> {
    const now = new Date().toISOString();
    await storage.patchMemo(id, { deletedAt: now, updatedAt: now });
    return now;
  },

  async softDeleteMany(ids: string[]): Promise<string> {
    const now = new Date().toISOString();
    await Promise.all(ids.map((id) => storage.patchMemo(id, { deletedAt: now, updatedAt: now })));
    return now;
  },

  async listTrash(): Promise<MemoSummary[]> {
    const memos = await storage.listMemos();
    return memos
      .filter((memo) => memo.deletedAt != null)
      .sort((a, b) => (a.deletedAt! < b.deletedAt! ? 1 : a.deletedAt! > b.deletedAt! ? -1 : 0));
  },

  async restore(id: string): Promise<void> {
    await storage.patchMemo(id, { deletedAt: null, updatedAt: new Date().toISOString() });
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
