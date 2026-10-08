import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Settings } from '@/shared/types';
import { storage } from '@/shared/storage';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => storage.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => storage.saveSettings(settings),
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previous = queryClient.getQueryData<Settings>(['settings']);
      queryClient.setQueryData(['settings'], settings);
      return { previous };
    },
    onError: (_error, _settings, context) => {
      if (context) queryClient.setQueryData(['settings'], context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
