import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SecretCancelledError } from '@/features/security/utils/secretGate';
import type { Memo } from '@/shared/types';
import { memoApi } from '../api/memoApi';
import {
  findCachedMemo,
  invalidateMemoQueries,
  pauseMemoQueries,
  restoreMemoQueries,
  upsertMemoCaches,
} from './memoCache';

export function useMemoMutations() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (memo: Memo) => memoApi.save(memo),
    onMutate: async (memo) => {
      upsertMemoCaches(queryClient, memo);
    },
    onError: (error, memo, snapshot) => {
      if (error instanceof SecretCancelledError) {
        if (snapshot) restoreMemoQueries(queryClient, snapshot);
        return;
      }
      upsertMemoCaches(queryClient, memo);
    },
    onSuccess: (saved) => {
      upsertMemoCaches(queryClient, saved);
    },
    onSettled: (_data, error) => {
      if (error instanceof SecretCancelledError) return;
      if (error) return;
      void queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  const softDelete = useMutation({
    mutationFn: (id: string) => memoApi.softDelete(id),
    onMutate: async (id) => {
      const snapshot = await pauseMemoQueries(queryClient);
      const memo = findCachedMemo(queryClient, id);
      if (memo && !memo.deletedAt) {
        upsertMemoCaches(queryClient, { ...memo, deletedAt: new Date().toISOString() });
      }
      return snapshot;
    },
    onError: (_error, _id, snapshot) => {
      if (snapshot) restoreMemoQueries(queryClient, snapshot);
    },
    onSettled: () => invalidateMemoQueries(queryClient),
  });

  const softDeleteMany = useMutation({
    mutationFn: (ids: string[]) => memoApi.softDeleteMany(ids),
    onMutate: async (ids) => {
      const snapshot = await pauseMemoQueries(queryClient);
      const deletedAt = new Date().toISOString();
      for (const id of ids) {
        const memo = findCachedMemo(queryClient, id);
        if (memo && !memo.deletedAt) upsertMemoCaches(queryClient, { ...memo, deletedAt });
      }
      return snapshot;
    },
    onError: (_error, _ids, snapshot) => {
      if (snapshot) restoreMemoQueries(queryClient, snapshot);
    },
    onSettled: () => invalidateMemoQueries(queryClient),
  });

  return { save, softDelete, softDeleteMany };
}
