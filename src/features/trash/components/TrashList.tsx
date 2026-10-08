import type { Memo } from '@/shared/types';
import { TrashItem } from './TrashItem';

type TrashListProps = {
  memos: Memo[];
  onRestore: (id: string) => void;
  onDelete: (memo: Memo) => void;
};

export function TrashList({ memos, onRestore, onDelete }: TrashListProps) {
  if (memos.length === 0) return null;
  return (
    <ul className="mt-4">
      {memos.map((memo) => (
        <TrashItem key={memo.id} memo={memo} onRestore={onRestore} onDelete={onDelete} />
      ))}
    </ul>
  );
}
