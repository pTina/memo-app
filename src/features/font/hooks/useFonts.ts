import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateMemoQueries } from '@/features/memo/hooks/memoCache';
import type { FontFile, Memo, Settings } from '@/shared/types';
import { fontApi } from '../api/fontApi';

export function useFonts() {
  return useQuery({
    queryKey: ['fonts'],
    queryFn: () => fontApi.list(),
  });
}

export function useFontMutations() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (font: FontFile) => fontApi.save(font),
    onMutate: async (font) => {
      await queryClient.cancelQueries({ queryKey: ['fonts'] });
      const previous = queryClient.getQueryData<FontFile[]>(['fonts']);
      queryClient.setQueryData<FontFile[]>(['fonts'], (current) => {
        const without = (current ?? []).filter((item) => item.id !== font.id);
        return [font, ...without];
      });
      return { previous };
    },
    onError: (_error, _font, context) => {
      if (context) queryClient.setQueryData(['fonts'], context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['fonts'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => fontApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['fonts'] });
      queryClient.setQueriesData<Memo[]>({ queryKey: ['memos'] }, (current) => (
        current?.map((memo) => (memo.fontId === id ? { ...memo, fontId: null } : memo))
      ));
      queryClient.setQueriesData<Memo | null>({ queryKey: ['memo'] }, (current) => (
        current && current.fontId === id ? { ...current, fontId: null } : current
      ));
      queryClient.setQueryData<Settings>(['settings'], (current) => (
        current && current.defaultFontId === id ? { ...current, defaultFontId: null } : current
      ));
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<FontFile[]>(['fonts'], (current) => current?.filter((font) => font.id !== id));
    },
    onError: () => {
      invalidateMemoQueries(queryClient);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['fonts'] });
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      invalidateMemoQueries(queryClient);
    },
  });

  return { save, remove };
}
