import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  findCachedMemo,
  invalidateMemoQueries,
  pauseMemoQueries,
  removeMemoCaches,
  restoreMemoQueries,
  upsertMemoCaches,
} from '@/features/memo/hooks/memoCache';
import { memoApi } from '@/features/memo/api/memoApi';

export function useTrashMutations() {
  const queryClient = useQueryClient();

  const restore = useMutation({
    mutationFn: (id: string) => memoApi.restore(id),
    onMutate: async (id) => {
      const snapshot = await pauseMemoQueries(queryClient);
      const memo = findCachedMemo(queryClient, id);
      if (memo) upsertMemoCaches(queryClient, { ...memo, deletedAt: null });
      return snapshot;
    },
    onError: (_error, _id, snapshot) => {
      if (snapshot) restoreMemoQueries(queryClient, snapshot);
    },
    onSettled: () => invalidateMemoQueries(queryClient),
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => memoApi.remove(ids),
    onMutate: async (ids) => {
      const snapshot = await pauseMemoQueries(queryClient);
      removeMemoCaches(queryClient, ids);
      return snapshot;
    },
    onError: (_error, _ids, snapshot) => {
      if (snapshot) restoreMemoQueries(queryClient, snapshot);
    },
    onSettled: () => invalidateMemoQueries(queryClient),
  });

  const empty = useMutation({
    mutationFn: () => memoApi.emptyTrash(),
    onMutate: async () => {
      const snapshot = await pauseMemoQueries(queryClient);
      const ids = queryClient.getQueryData<Array<{ id: string }>>(['trash'])?.map((memo) => memo.id) ?? [];
      removeMemoCaches(queryClient, ids);
      return snapshot;
    },
    onError: (_error, _vars, snapshot) => {
      if (snapshot) restoreMemoQueries(queryClient, snapshot);
    },
    onSettled: () => invalidateMemoQueries(queryClient),
  });

  return { restore, remove, empty };
}
