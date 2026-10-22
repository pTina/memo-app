import { useEffect, useRef, useState } from 'react';
import type { FontFile } from '@/shared/types';
import { AlertDialog } from '@/shared/ui/AlertDialog';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { CloseIcon, DeleteIcon, UploadIcon } from '@/shared/ui/icons';
import { useFontMutations, useFonts } from '../hooks/useFonts';
import {
  FONT_MAX_COUNT,
  FONT_MAX_TOTAL_BYTES,
  displayNameFromFile,
  formatBytes,
  validateFontFile,
} from '../utils/validateFont';

type FontManagerModalProps = {
  onClose: () => void;
};

export function FontManagerModal({ onClose }: FontManagerModalProps) {
  const { data } = useFonts();
  const { save, remove } = useFontMutations();
  const fonts = data ?? [];
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<FontFile | null>(null);
  const used = fonts.reduce((sum, font) => sum + font.size, 0);

  useEffect(() => {
    if (!renameId) closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pendingDelete && !renameId && !error) {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current || pendingDelete || error) return;
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
  }, [pendingDelete, renameId, error]);

  useEffect(() => {
    if (renameId) renameInputRef.current?.focus();
  }, [renameId]);

  async function addFiles(list: FileList | File[]) {
    const files = [...list];
    let current = fonts;
    for (const file of files) {
      const result = await validateFontFile(file, current);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      const font: FontFile = {
        id: crypto.randomUUID(),
        name: displayNameFromFile(file),
        format: result.format,
        size: file.size,
        blob: file,
        createdAt: new Date().toISOString(),
      };
      await save.mutateAsync(font);
      current = [font, ...current.filter((item) => item.id !== font.id)];
      setError(null);
    }
  }

  function commitRename() {
    const font = fonts.find((item) => item.id === renameId);
    const name = renameValue.trim();
    if (font && name && name !== font.name) {
      save.mutate({ ...font, name });
    }
    setRenameId(null);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4" onMouseDown={() => onCloseRef.current()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="font-manager-title"
        className="flex max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-lg flex-col rounded-xl border border-line-strong bg-paper p-5 text-ink shadow-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <h2 id="font-manager-title" className="flex-1 text-lg">폰트 관리</h2>
          <button ref={closeRef} type="button" aria-label="닫기" className="inline-flex size-9 items-center justify-center rounded-lg text-ink" onClick={() => onCloseRef.current()}>
            <CloseIcon />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {fonts.length}/{FONT_MAX_COUNT}개 · {formatBytes(used)} / {formatBytes(FONT_MAX_TOTAL_BYTES)}
        </p>
        <label
          className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm ${dragging ? 'border-ink bg-accent' : 'border-line-strong bg-canvas'}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void addFiles(event.dataTransfer.files);
          }}
        >
          <UploadIcon />
          파일을 끌어다 놓거나 클릭해서 올리기
          <span className="text-muted">ttf, otf, woff, woff2 · 파일당 20MB</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
        <ul className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {fonts.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">올린 폰트가 없습니다.</li>
          ) : fonts.map((font) => (
            <li key={font.id} className="flex items-center gap-2 border-t border-line py-2">
              {renameId === font.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  aria-label="서체 이름"
                  className="min-w-0 flex-1 rounded-lg border border-line-strong bg-canvas px-2 py-1 text-sm text-ink"
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setRenameId(null);
                    }
                  }}
                />
              ) : (
                <p className="min-w-0 flex-1 truncate text-sm text-ink">
                  {font.name}
                  <span className="ml-2 text-muted">{formatBytes(font.size)}</span>
                </p>
              )}
              {renameId === font.id ? null : (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm text-ink"
                  onClick={() => {
                    setRenameId(font.id);
                    setRenameValue(font.name);
                  }}
                >
                  이름 변경
                </button>
              )}
              <button type="button" aria-label={`${font.name} 삭제`} className="inline-flex size-9 items-center justify-center rounded-lg text-ink" onClick={() => setPendingDelete(font)}>
                <DeleteIcon />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {error ? (
        <AlertDialog title="업로드할 수 없습니다" description={error} onClose={() => setError(null)} />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="폰트 삭제"
          titleId="font-delete-title"
          description="이 서체를 쓰던 메모는 기본 서체로 바뀝니다."
          confirmLabel="삭제"
          confirmIcon={<DeleteIcon className="text-sunday" />}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
          }}
        />
      ) : null}
    </div>
  );
}