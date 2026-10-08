import type { Memo, SortBy } from '@/shared/types';

export function sortMemos(memos: Memo[], sortBy: SortBy): Memo[] {
  return [...memos].sort((a, b) => {
    if (a[sortBy] === b[sortBy]) return 0;
    return a[sortBy] < b[sortBy] ? 1 : -1;
  });
}
