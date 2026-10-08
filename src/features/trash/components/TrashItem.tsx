import { daysUntilPurge } from '@/features/trash/utils/purgeExpired';
import { formatMemoDate } from '@/shared/lib/dateUtils';
import { DeleteIcon, RestoreIcon } from '@/shared/ui/icons';
import type { Memo } from '@/shared/types';

type TrashItemProps = {
  memo: Memo;
  onRestore: (id: string) => void;
  onDelete: (memo: Memo) => void;
};

export function TrashItem({ memo, onRestore, onDelete }: TrashItemProps) {
  const title = memo.title.trim() || '제목 없음';
  const deletedAt = memo.deletedAt ?? '';
  const days = daysUntilPurge(deletedAt);
  const remain = days === 0 ? '곧 영구 삭제됩니다' : `${days}일 남음`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
      <div className="min-w-0">
        <p className={`truncate ${memo.title.trim() ? 'text-ink' : 'text-faint'}`}>{title}</p>
        <p className="mt-1 text-sm text-muted">삭제일 {formatMemoDate(deletedAt)} · {remain}</p>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={`${title} 복원`} className="inline-flex size-10 items-center justify-center rounded-lg text-ink" onClick={() => onRestore(memo.id)}>
          <RestoreIcon />
        </button>
        <button type="button" aria-label={`${title} 영구 삭제`} className="inline-flex size-10 items-center justify-center rounded-lg text-sunday" onClick={() => onDelete(memo)}>
          <DeleteIcon />
        </button>
      </div>
    </li>
  );
}
