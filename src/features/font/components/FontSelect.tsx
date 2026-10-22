import Select from 'react-select';
import type { FontFile } from '@/shared/types';
import { PlusIcon } from '@/shared/ui/icons';
import { fontFamilyName, isFontReady, useFontReadyTick } from '../hooks/useFontFace';

type FontOption = {
  value: string;
  label: string;
  fontId: string | null;
};

type FontSelectProps = {
  fonts: FontFile[];
  value: string | null;
  onChange: (fontId: string | null) => void;
  onManage?: () => void;
  inputId?: string;
};

function optionStyle(fontId: string | null) {
  if (fontId && isFontReady(fontId)) return { fontFamily: `"${fontFamilyName(fontId)}", var(--font-sans)` };
  return { fontFamily: 'var(--font-sans)' };
}

export function FontSelect({ fonts, value, onChange, onManage, inputId = 'memo-font-select' }: FontSelectProps) {
  useFontReadyTick();
  const options: FontOption[] = [
    { value: '', label: '기본 서체', fontId: null },
    ...fonts.map((font) => ({ value: font.id, label: font.name, fontId: font.id })),
  ];
  const selected = options.find((option) => option.value === (value ?? '')) ?? options[0];

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <label className="sr-only" htmlFor={inputId}>서체</label>
      <Select<FontOption>
        inputId={inputId}
        unstyled
        isSearchable={false}
        options={options}
        value={selected}
        onChange={(option) => onChange(option?.fontId ?? null)}
        formatOptionLabel={(option) => <span style={optionStyle(option.fontId)}>{option.label}</span>}
        menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
        menuPosition="fixed"
        className="min-w-40 max-w-56 flex-1"
        classNames={{
          control: () => 'rounded-lg border border-line-strong bg-paper px-2 py-1.5 text-sm text-ink',
          valueContainer: () => 'min-w-0',
          singleValue: () => 'truncate',
          indicatorsContainer: () => 'text-muted',
          menu: () => 'z-[80] mt-1 overflow-hidden rounded-xl border border-line-strong bg-paper shadow-panel',
          menuList: () => 'max-h-56 overflow-auto py-1',
          option: (state) => `px-3 py-2 text-sm text-ink ${state.isFocused ? 'bg-accent' : ''} ${state.isSelected ? 'bg-accent' : ''}`,
        }}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 80 }),
        }}
      />
      {onManage ? (
        <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-ink" onClick={onManage}>
          <PlusIcon />
          폰트 관리
        </button>
      ) : null}
    </div>
  );
}