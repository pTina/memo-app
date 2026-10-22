type BulkDeleteBarProps = {
  count: number;
  disabled: boolean;
  onDelete: () => void;
};

export function BulkDeleteBar({ count, disabled, onDelete }: BulkDeleteBarProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onDelete}
      className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      선택 삭제{count > 0 ? ` (${count})` : ''}
    </button>
  );
}
