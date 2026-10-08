import { fontFamilyName, isFontReady, useFontReadyTick } from '@/features/font/hooks/useFontFace';
import type { Memo } from '@/shared/types';
import { MemoCard } from './MemoCard';

type MemoGridProps = {
  memos: Memo[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onTrash: (id: string) => void;
};

export function MemoGrid({ memos, selectedIds, onToggle, onTrash }: MemoGridProps) {
  useFontReadyTick();

  if (memos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {memos.map((memo) => (
        <MemoCard
          key={memo.id}
          memo={memo}
          selected={selectedIds.includes(memo.id)}
          fontFamily={memo.fontId && isFontReady(memo.fontId) ? fontFamilyName(memo.fontId) : undefined}
          onToggle={onToggle}
          onTrash={onTrash}
        />
      ))}
    </div>
  );
}
