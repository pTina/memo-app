import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import type { SortBy } from '@/shared/types';

export function SortSelect() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();
  const settings = data ?? readSettingsSync();

  function onChange(sortBy: SortBy) {
    updateSettings.mutate({ ...settings, sortBy });
  }

  return (
    <select
      aria-label="정렬"
      value={settings.sortBy}
      onChange={(event) => onChange(event.target.value as SortBy)}
      className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
    >
      <option value="createdAt">최근 생성순</option>
      <option value="updatedAt">최근 수정순</option>
    </select>
  );
}
