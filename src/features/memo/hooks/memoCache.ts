import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Memo, MemoSummary } from '@/shared/types';
import { toMemoSummary } from '@/shared/types';

export type MemoCacheSnapshot = {
  lists: Array<[QueryKey, MemoSummary[] | undefined]>;
  trash: MemoSummary[] | undefined;
  items: Array<[QueryKey, Memo | null | undefined]>;
};

export async function pauseMemoQueries(queryClient: QueryClient): Promise<MemoCacheSnapshot> {
  await queryClient.cancelQueries({ queryKey: ['memos'] });
  await queryClient.cancelQueries({ queryKey: ['trash'] });
  return {
    lists: queryClient.getQueriesData<MemoSummary[]>({ queryKey: ['memos'] }),
    trash: queryClient.getQueryData<MemoSummary[]>(['trash']),
    items: queryClient.getQueriesData<Memo | null>({ queryKey: ['memo'] }),
  };
}

export function restoreMemoQueries(queryClient: QueryClient, snapshot: MemoCacheSnapshot) {
  for (const [key, data] of snapshot.lists) queryClient.setQueryData(key, data);
  queryClient.setQueryData(['trash'], snapshot.trash);
  for (const [key, data] of snapshot.items) queryClient.setQueryData(key, data);
}

export function invalidateMemoQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['memos'] });
  void queryClient.invalidateQueries({ queryKey: ['trash'] });
}

export function findCachedMemo(queryClient: QueryClient, id: string): Memo | MemoSummary | undefined {
  const direct = queryClient.getQueryData<Memo | null>(['memo', id]);
  if (direct) return direct;
  const lists = queryClient.getQueriesData<MemoSummary[]>({ queryKey: ['memos'] });
  for (const [, data] of lists) {
    const found = data?.find((memo) => memo.id === id);
    if (found) return found;
  }
  return queryClient.getQueryData<MemoSummary[]>(['trash'])?.find((memo) => memo.id === id);
}

export function upsertMemoCaches(queryClient: QueryClient, memo: Memo | MemoSummary) {
  const summary = toMemoSummary(memo);
  if ('content' in memo) {
    queryClient.setQueryData(['memo', memo.id], memo);
  } else {
    queryClient.setQueryData<Memo | null>(['memo', memo.id], (current) => (
      current ? { ...current, ...summary } : current
    ));
  }
  queryClient.setQueriesData<MemoSummary[]>({ queryKey: ['memos'] }, (current) => {
    if (!current) return current;
    const index = current.findIndex((item) => item.id === memo.id);
    if (memo.deletedAt) return current.filter((item) => item.id !== memo.id);
    if (index === -1) return [summary, ...current];
    const next = current.slice();
    next[index] = summary;
    return next;
  });
  queryClient.setQueryData<MemoSummary[]>(['trash'], (current) => {
    if (!current) return current;
    const without = current.filter((item) => item.id !== memo.id);
    if (!memo.deletedAt) return without;
    return [summary, ...without];
  });
}

export function removeMemoCaches(queryClient: QueryClient, ids: string[]) {
  const idSet = new Set(ids);
  queryClient.setQueriesData<MemoSummary[]>({ queryKey: ['memos'] }, (current) => (
    current?.filter((memo) => !idSet.has(memo.id))
  ));
  queryClient.setQueryData<MemoSummary[]>(['trash'], (current) => (
    current?.filter((memo) => !idSet.has(memo.id))
  ));
  for (const id of ids) queryClient.setQueryData(['memo', id], null);
}
