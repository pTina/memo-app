import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Memo } from '@/shared/types';
import { toMemoSummary } from '@/shared/types';
import { isDraft } from '../utils/draftMemos';
import { memoApi } from '../api/memoApi';
import { findCachedMemo } from './memoCache';

export function useMemo(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['memo', id],
    queryFn: async () => {
      const found = await memoApi.get(id);
      const cached = queryClient.getQueryData<Memo | null>(['memo', id]);
      if (found && cached && cached.updatedAt > found.updatedAt) {
        return {
          ...found,
          title: cached.title,
          fontId: cached.fontId,
          content: cached.content,
          plainText: cached.plainText,
          updatedAt: cached.updatedAt,
        };
      }
      if (found) return found;
      const fallback = cached ?? findCachedMemo(queryClient, id);
      if (!fallback) return null;
      if ('content' in fallback && fallback.content) return fallback;
      return { ...toMemoSummary(fallback), content: { type: 'doc', content: [] } };
    },
    enabled: id.length > 0 && !isDraft(id),
    placeholderData: (previous) => previous,
    initialData: () => {
      const cached = queryClient.getQueryData<Memo | null>(['memo', id]);
      if (cached && 'content' in cached && cached.content) return cached;
      return undefined;
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(['memo', id])?.dataUpdatedAt,
  });
}
