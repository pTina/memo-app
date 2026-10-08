import { create } from 'zustand';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import { resolveTheme } from '@/features/theme/resolveTheme';
import type { ResolvedTheme } from '@/shared/types';

type UiState = {
  selectedIds: string[];
  searchQuery: string;
  activeModal: string | null;
  resolvedTheme: ResolvedTheme;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectedId: (id: string) => void;
  clearSelectedIds: () => void;
  setSearchQuery: (query: string) => void;
  setActiveModal: (modal: string | null) => void;
  setResolvedTheme: (theme: ResolvedTheme) => void;
};

function initialResolvedTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return resolveTheme(readSettingsSync().theme);
}

export const useUiStore = create<UiState>((set) => ({
  selectedIds: [],
  searchQuery: '',
  activeModal: null,
  resolvedTheme: initialResolvedTheme(),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleSelectedId: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((item) => item !== id)
      : [...state.selectedIds, id],
  })),
  clearSelectedIds: () => set({ selectedIds: [] }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
}));
