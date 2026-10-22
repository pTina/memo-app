import type { Memo } from '@/shared/types';
import { TrashItem } from './TrashItem';

type TrashListProps = {
  memos: Memo[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (memo: Memo) => void;
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
