import { useQuery } from '@tanstack/react-query';
import type { SortBy } from '@/shared/types';
import { memoApi } from '../api/memoApi';

export function useMemos(sortBy: SortBy, query: string) {
  return useQuery({
    queryKey: ['memos', { sortBy, q: query }],
    queryFn: () => memoApi.listActive(sortBy, query),
  });
}
