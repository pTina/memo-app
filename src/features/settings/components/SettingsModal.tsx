import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FontManagerModal } from '@/features/font/components/FontManagerModal';
import { FontSelect } from '@/features/font/components/FontSelect';
import { useFonts } from '@/features/font/hooks/useFonts';
import { invalidateMemoQueries } from '@/features/memo/hooks/memoCache';
import { useTheme } from '@/features/theme/hooks/useTheme';
import { usesCloudStorage } from '@/shared/lib/firebase';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import type { ThemePreference } from '@/shared/types';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { CloseIcon, DeleteIcon } from '@/shared/ui/icons';
import { useUiStore } from '@/store/useUiStore';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { clearLocalData } from '../utils/clearLocalData';

const themeOptions: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: '시스템' },
  { id: 'light', label: '라이트' },
  { id: 'dark', label: '다크' },
];

type SettingsModalProps = {
  onClose: () => void;
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const queryClient = useQueryClient();
  const { data: settingsData } = useSettings();
  const settings = settingsData ?? readSettingsSync();
  const updateSettings = useUpdateSettings();
  const { setTheme } = useTheme();
  const { data: fonts } = useFonts();
  const clearSelectedIds = useUiStore((state) => state.clearSelectedIds);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [fontsOpen, setFontsOpen] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !confirmWipe && !fontsOpen) onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmWipe, fontsOpen]);

  function patch(next: Partial<typeof settings>) {
    updateSettings.mutate({ ...settings, ...next });
  }

  async function wipe() {
    setWiping(true);
    try {
      await clearLocalData();
      invalidateMemoQueries(queryClient);
      clearSelectedIds();
      setConfirmWipe(false);
      onCloseRef.current();
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onMouseDown={() => onCloseRef.current()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-md rounded-xl border border-line-strong bg-paper p-5 text-ink shadow-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <h2 id="settings-title" className="flex-1 text-lg">설정</h2>
          <button ref={closeRef} type="button" aria-label="닫기" className="inline-flex size-9 items-center justify-center rounded-lg text-ink" onClick={() => onCloseRef.current()}>
            <CloseIcon />
          </button>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm">기본 테마</legend>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {themeOptions.map((option) => (
              <label key={option.id} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="settings-theme"
                  checked={settings.theme === option.id}
                  onChange={() => setTheme(option.id)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-5 text-sm" id="settings-default-font-label">새 메모 기본 서체</p>
        <div className="mt-1">
          <FontSelect
            inputId="settings-default-font"
            fonts={fonts ?? []}
            value={settings.defaultFontId}
            onChange={(fontId) => patch({ defaultFontId: fontId })}
            onManage={() => setFontsOpen(true)}
          />
        </div>
        <label className="mt-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.dateWithTime}
            onChange={(event) => patch({ dateWithTime: event.target.checked })}
          />
          날짜 삽입 시 시간 포함
        </label>
        {usesCloudStorage() ? (
          <label className="mt-5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.secretCheck}
              onChange={(event) => patch({ secretCheck: event.target.checked })}
            />
            저장 전 비밀값 검사
          </label>
        ) : null}
        <div className="mt-8 border-t border-line pt-5">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            onClick={() => setConfirmWipe(true)}
          >
            <DeleteIcon className="text-sunday" />
            로컬 데이터 전체 삭제
          </button>
        </div>
      </div>
      {fontsOpen ? <FontManagerModal onClose={() => setFontsOpen(false)} /> : null}
      {confirmWipe ? (
        <ConfirmDialog
          title="로컬 데이터 삭제"
          titleId="settings-wipe-title"
          description="모든 메모를 휴지통으로 옮깁니다."
          confirmLabel="휴지통으로 이동"
          confirmIcon={<DeleteIcon className="text-sunday" />}
          onClose={() => setConfirmWipe(false)}
          onConfirm={() => {
            if (!wiping) void wipe();
          }}
        />
      ) : null}
    </div>
  );
}