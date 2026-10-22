import { useRef, type PointerEvent } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const width = typeof node.attrs.width === 'number' ? node.attrs.width : null;
  const start = useRef({ x: 0, width: 0 });

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const image = (event.currentTarget.previousElementSibling as HTMLImageElement | null);
    const current = width ?? image?.getBoundingClientRect().width ?? 240;
    start.current = { x: event.clientX, width: current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = Math.min(720, Math.max(80, start.current.width + event.clientX - start.current.x));
    updateAttributes({ width: Math.round(next) });
  }

  return (
    <NodeViewWrapper className={`memo-image${selected ? ' is-selected' : ''}`} data-drag-handle>
      <img src={node.attrs.src as string} alt="" style={width ? { width: `${width}px` } : undefined} />
      <button
        type="button"
        aria-label="이미지 크기 조절"
        className="memo-image-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      />
    </NodeViewWrapper>
  );
}