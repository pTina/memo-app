import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Memo } from '@/shared/types';
import { isDraft } from '../utils/draftMemos';
import { memoApi } from '../api/memoApi';

export function useMemo(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['memo', id],
    queryFn: async () => {
      const found = await memoApi.get(id);
      if (found) return found;
      return queryClient.getQueryData<Memo | null>(['memo', id]) ?? null;
    },
    enabled: id.length > 0 && !isDraft(id),
    placeholderData: (previous) => previous,
    initialData: () => queryClient.getQueryData<Memo>(['memo', id]),
    initialDataUpdatedAt: () => queryClient.getQueryState(['memo', id])?.dataUpdatedAt,
  });
}
