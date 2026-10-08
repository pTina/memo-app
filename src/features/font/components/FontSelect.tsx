import type { FontFile } from '@/shared/types';
import { PlusIcon } from '@/shared/ui/icons';

type FontSelectProps = {
  fonts: FontFile[];
  value: string | null;
  onChange: (fontId: string | null) => void;
  onManage: () => void;
};

export function FontSelect({ fonts, value, onChange, onManage }: FontSelectProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <label className="sr-only" htmlFor="memo-font-select">서체</label>
      <select
        id="memo-font-select"
        value={value ?? ''}
        className="max-w-40 truncate rounded-lg border border-line-strong bg-paper px-2 py-1.5 text-sm text-ink"
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">기본 서체</option>
        {fonts.map((font) => (
          <option key={font.id} value={font.id}>{font.name}</option>
        ))}
      </select>
      <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-ink" onClick={onManage}>
        <PlusIcon />
        폰트 관리
      </button>
    </div>
  );
}