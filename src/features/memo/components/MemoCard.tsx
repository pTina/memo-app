import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router';
import { formatMemoDate } from '@/shared/lib/dateUtils';
import type { Memo } from '@/shared/types';

type MemoCardProps = {
  memo: Memo;
  selected: boolean;
  fontFamily?: string;
  onToggle: (id: string) => void;
  onTrash: (id: string) => void;
};

export function MemoCard({ memo, selected, fontFamily, onToggle, onTrash }: MemoCardProps) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<'x' | 'y' | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const title = memo.title.trim() || '제목 없음';
  const preview = memo.plainText.trim() || '내용 없음';

  function setDrag(value: number) {
    offsetRef.current = value;
    setOffset(value);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch') return;
    dragging.current = true;
    moved.current = false;
    axis.current = null;
    startX.current = event.clientX;
    startY.current = event.clientY;
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging.current) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    if (!axis.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (axis.current !== 'x') return;
    moved.current = true;
    setDrag(Math.min(0, dx));
  }

  function finishDrag() {
    if (!dragging.current) return;
    dragging.current = false;
    if (axis.current === 'x' && offsetRef.current < -80) onTrash(memo.id);
    axis.current = null;
    setDrag(0);
  }

  return (
    <article
      className={`touch-pan-y rounded-xl border bg-paper p-4 ${selected ? 'border-accent' : 'border-line-strong'}`}
      style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-ink"
          checked={selected}
          aria-label={`${title} 선택`}
          onChange={() => onToggle(memo.id)}
        />
        <Link
          to={`/memos/${memo.id}`}
          className="min-w-0 flex-1"
          style={fontFamily ? { fontFamily: `"${fontFamily}", var(--font-sans)` } : undefined}
          onClick={(event) => {
            if (!moved.current) return;
            event.preventDefault();
            moved.current = false;
          }}
        >
          <h2 className={`truncate text-base ${memo.title.trim() ? 'text-ink' : 'text-faint'}`}>{title}</h2>
          <p className={`mt-1 line-clamp-2 text-sm ${memo.plainText.trim() ? 'text-muted' : 'text-faint'}`}>{preview}</p>
          <time className="mt-3 block text-sm text-muted" dateTime={memo.updatedAt}>
            수정 {formatMemoDate(memo.updatedAt)}
          </time>
        </Link>
      </div>
    </article>
  );
}
