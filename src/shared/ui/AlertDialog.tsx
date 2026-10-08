import { useEffect, useRef } from 'react';

type AlertDialogProps = {
  title: string;
  description: string;
  onClose: () => void;
};

export function AlertDialog({ title, description, onClose }: AlertDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    okRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      event.preventDefault();
      okRef.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4"
      onMouseDown={(event) => {
        event.stopPropagation();
        onCloseRef.current();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-desc"
        className="w-full max-w-sm rounded-xl border border-line-strong bg-paper p-5 text-ink shadow-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="alert-dialog-title" className="text-lg">{title}</h2>
        <p id="alert-dialog-desc" className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-5 flex justify-end">
          <button ref={okRef} type="button" className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink" onClick={() => onCloseRef.current()}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}