import { useQuery } from '@tanstack/react-query';
import { memoApi } from '../api/memoApi';

export function useMemo(id: string) {
  return useQuery({
    queryKey: ['memo', id],
    queryFn: () => memoApi.get(id),
    enabled: id.length > 0,
  });
}
