import { useEffect, useRef, useState } from 'react';
import { resolveSecretGate, subscribeSecretGate, type SecretPending } from '../utils/secretGate';

export function SecretWarningDialog() {
  const [pending, setPending] = useState<SecretPending | null>(null);
  const maskRef = useRef<HTMLButtonElement>(null);

  useEffect(() => subscribeSecretGate(setPending), []);

  useEffect(() => {
    if (!pending) return undefined;
    maskRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') resolveSecretGate('cancel');
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending]);

  if (!pending) return null;

  const fields = [...new Set(pending.hits.map((hit) => (hit.field === 'title' ? '제목' : '본문')))].join(', ');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="secret-warning-title"
        className="w-full max-w-sm rounded-xl border border-line-strong bg-paper p-5 text-ink shadow-panel"
      >
        <h2 id="secret-warning-title" className="text-lg">비밀값이 포함되어 있습니다</h2>
        <p className="mt-2 text-sm text-muted">{fields}에서 키나 토큰 형식이 감지되었습니다. 계정에 올리기 전에 가리는 것을 권합니다.</p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            ref={maskRef}
            type="button"
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            onClick={() => resolveSecretGate('mask')}
          >
            마스킹 후 저장
          </button>
          <button type="button" className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink" onClick={() => resolveSecretGate('plain')}>
            그대로 저장
          </button>
          <button type="button" className="rounded-lg px-3 py-2 text-sm text-ink" onClick={() => resolveSecretGate('cancel')}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}