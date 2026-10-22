import { useNavigate } from 'react-router';
import { AccountMenu } from '@/features/auth/components/AccountMenu';
import { FontSelect } from '@/features/font/components/FontSelect';
import { useTheme } from '@/features/theme/hooks/useTheme';
import { usesCloudStorage } from '@/shared/lib/firebase';
import type { FontFile } from '@/shared/types';
import { BackIcon, DeleteIcon, MoonIcon, SunIcon } from '@/shared/ui/icons';

const themeLabel = { system: '시스템', light: '라이트', dark: '다크' } as const;
const themeOrder = ['system', 'light', 'dark'] as const;

type EditorHeaderProps = {
  fonts: FontFile[];
  fontId: string | null;
  onFontChange: (fontId: string | null) => void;
  onManageFonts: () => void;
  onDelete: () => void;
  onSave?: () => void;
  onLeave?: () => void;
  saving?: boolean;
};

export function EditorHeader({ fonts, fontId, onFontChange, onManageFonts, onDelete, onSave, onLeave, saving }: EditorHeaderProps) {
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  function cycleTheme() {
    const index = themeOrder.indexOf(theme);
    setTheme(themeOrder[(index + 1) % themeOrder.length]);
  }

  return (
    <header className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-1 py-2 text-sm text-ink"
        onClick={() => {
          onLeave?.();
          navigate('/');
        }}
      >
        <BackIcon />
        목록
      </button>
      <FontSelect fonts={fonts} value={fontId} onChange={onFontChange} onManage={onManageFonts} />
      <div className="ml-auto flex items-center gap-1">
        {onSave ? (
          <button
            type="button"
            disabled={saving}
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:opacity-40"
            onClick={onSave}
          >
            저장
          </button>
        ) : null}
        <button type="button" aria-label="삭제" className="inline-flex size-10 items-center justify-center rounded-lg text-ink" onClick={onDelete}>
          <DeleteIcon />
        </button>
        <button type="button" aria-label={`테마, 현재 ${themeLabel[theme]}`} className="inline-flex size-10 items-center justify-center rounded-lg text-ink" onClick={cycleTheme}>
          <ThemeIcon />
        </button>
        {usesCloudStorage() ? <AccountMenu /> : null}
      </div>
    </header>
  );
}