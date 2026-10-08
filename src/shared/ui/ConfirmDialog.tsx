import { useEffect, useRef, type ReactNode } from 'react';

type ConfirmDialogProps = {
  title: string;
  titleId?: string;
  description: string;
  confirmLabel: string;
  confirmIcon?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ title, titleId = 'confirm-dialog-title', description, confirmLabel, confirmIcon, onConfirm, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((item) => !item.hasAttribute('disabled'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onMouseDown={(event) => {
        event.stopPropagation();
        onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-line-strong bg-paper p-5 text-ink shadow-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg">{title}</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink" onClick={() => onCloseRef.current()}>
            취소
          </button>
          <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink" onClick={onConfirm}>
            {confirmIcon}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
