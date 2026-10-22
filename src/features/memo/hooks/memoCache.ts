import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { Memo } from '@/shared/types';

export type MemoCacheSnapshot = {
  lists: Array<[QueryKey, Memo[] | undefined]>;
  trash: Memo[] | undefined;
  items: Array<[QueryKey, Memo | null | undefined]>;
};

export async function pauseMemoQueries(queryClient: QueryClient): Promise<MemoCacheSnapshot> {
  await queryClient.cancelQueries({ queryKey: ['memos'] });
  await queryClient.cancelQueries({ queryKey: ['trash'] });
  return {
    lists: queryClient.getQueriesData<Memo[]>({ queryKey: ['memos'] }),
    trash: queryClient.getQueryData<Memo[]>(['trash']),
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

export function findCachedMemo(queryClient: QueryClient, id: string): Memo | undefined {
  const direct = queryClient.getQueryData<Memo | null>(['memo', id]);
  if (direct) return direct;
  const lists = queryClient.getQueriesData<Memo[]>({ queryKey: ['memos'] });
  for (const [, data] of lists) {
    const found = data?.find((memo) => memo.id === id);
    if (found) return found;
  }
  return queryClient.getQueryData<Memo[]>(['trash'])?.find((memo) => memo.id === id);
}

export function upsertMemoCaches(queryClient: QueryClient, memo: Memo) {
  queryClient.setQueryData(['memo', memo.id], memo);
  const lists = queryClient.getQueriesData<Memo[]>({ queryKey: ['memos'] });
  if (lists.length === 0) {
    queryClient.setQueryData<Memo[]>(['memos', { sortBy: 'createdAt', q: '' }], memo.deletedAt ? [] : [memo]);
    queryClient.setQueryData<Memo[]>(['memos', { sortBy: 'updatedAt', q: '' }], memo.deletedAt ? [] : [memo]);
  }
  queryClient.setQueriesData<Memo[]>({ queryKey: ['memos'] }, (current) => {
    const list = current ?? [];
    const index = list.findIndex((item) => item.id === memo.id);
    if (memo.deletedAt) return list.filter((item) => item.id !== memo.id);
    if (index === -1) return [memo, ...list];
    const next = list.slice();
    next[index] = memo;
    return next;
  });
  queryClient.setQueryData<Memo[]>(['trash'], (current) => {
    if (!current) return current;
    const without = current.filter((item) => item.id !== memo.id);
    if (!memo.deletedAt) return without;
    return [memo, ...without];
  });
}

export function removeMemoCaches(queryClient: QueryClient, ids: string[]) {
  const idSet = new Set(ids);
  queryClient.setQueriesData<Memo[]>({ queryKey: ['memos'] }, (current) => (
    current?.filter((memo) => !idSet.has(memo.id))
  ));
  queryClient.setQueryData<Memo[]>(['trash'], (current) => (
    current?.filter((memo) => !idSet.has(memo.id))
  ));
  for (const id of ids) queryClient.setQueryData(['memo', id], null);
}
