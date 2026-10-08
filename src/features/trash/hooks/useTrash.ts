import { useQuery } from '@tanstack/react-query';
import { memoApi } from '@/features/memo/api/memoApi';

export function useTrash() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: () => memoApi.listTrash(),
  });
}
