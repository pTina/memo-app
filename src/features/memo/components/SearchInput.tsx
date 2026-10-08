import { CloseIcon, SearchIcon } from '@/shared/ui/icons';
import { useUiStore } from '@/store/useUiStore';

export function SearchInput() {
  const query = useUiStore((state) => state.searchQuery);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);

  return (
    <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 py-2">
      <SearchIcon />
      <input
        value={query}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="검색"
        aria-label="메모 검색"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
      />
      {query ? (
        <button type="button" aria-label="검색어 지우기" className="text-muted" onClick={() => setSearchQuery('')}>
          <CloseIcon />
        </button>
      ) : null}
    </label>
  );
}
