import { memoApi } from '@/features/memo/api/memoApi';
import { storage } from '@/shared/storage';

export async function clearLocalData() {
  const memos = await storage.listMemos();
  const ids = memos.filter((memo) => memo.deletedAt == null).map((memo) => memo.id);
  if (ids.length === 0) return;
  await memoApi.softDeleteMany(ids);
}