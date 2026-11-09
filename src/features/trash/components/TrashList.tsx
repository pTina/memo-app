import type { MemoSummary } from '@/shared/types';
import { TrashItem } from './TrashItem';

type TrashListProps = {
  memos: MemoSummary[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (memo: MemoSummary) => void;
};

export function TrashList({ memos, selectedIds, onToggle, onRestore, onDelete }: TrashListProps) {
  if (memos.length === 0) return null;
  return (
    <ul className="mt-4">
      {memos.map((memo) => (
        <TrashItem
          key={memo.id}
          memo={memo}
          selected={selectedIds.includes(memo.id)}
          onToggle={onToggle}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
