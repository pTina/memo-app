type ToastProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
};

export function Toast({ message, actionLabel, onAction, onClose }: ToastProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div role="status" className="flex max-w-md items-center gap-3 rounded-xl border border-line-strong bg-paper px-4 py-3 text-sm text-ink shadow-panel">
        <p className="min-w-0 flex-1">{message}</p>
        <button type="button" className="font-medium text-ink underline" onClick={onAction}>
          {actionLabel}
        </button>
        <button type="button" className="text-muted" aria-label="알림 닫기" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
