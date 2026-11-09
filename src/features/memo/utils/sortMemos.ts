import type { MemoSummary, SortBy } from '@/shared/types';

export function sortMemos<T extends MemoSummary>(memos: T[], sortBy: SortBy): T[] {
  return [...memos].sort((a, b) => {
    if (a[sortBy] === b[sortBy]) return 0;
    return a[sortBy] < b[sortBy] ? 1 : -1;
  });
}
