import { useEffect, useRef } from 'react';

type SelectAllCheckboxProps = {
  total: number;
  selected: number;
  disabled?: boolean;
  label?: string;
  onToggle: () => void;
};

export function SelectAllCheckbox({ total, selected, disabled, label = '전체 선택', onToggle }: SelectAllCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const all = total > 0 && selected === total;
  const some = selected > 0 && !all;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = some;
  }, [some]);

  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink">
      <input
        ref={inputRef}
        type="checkbox"
        checked={all}
        disabled={disabled || total === 0}
        aria-label={label}
        onChange={onToggle}
      />
      {label}
    </label>
  );
}