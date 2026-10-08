import { Link } from 'react-router';
import { FontSelect } from '@/features/font/components/FontSelect';
import { useTheme } from '@/features/theme/hooks/useTheme';
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
};

export function EditorHeader({ fonts, fontId, onFontChange, onManageFonts, onDelete }: EditorHeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  function cycleTheme() {
    const index = themeOrder.indexOf(theme);
    setTheme(themeOrder[(index + 1) % themeOrder.length]);
  }

  return (
    <header className="flex flex-wrap items-center gap-2">
      <Link to="/" className="inline-flex items-center gap-1 rounded-lg px-1 py-2 text-sm text-ink">
        <BackIcon />
        목록
      </Link>
      <FontSelect fonts={fonts} value={fontId} onChange={onFontChange} onManage={onManageFonts} />
      <div className="ml-auto flex items-center gap-1">
        <button type="button" aria-label="삭제" className="inline-flex size-10 items-center justify-center rounded-lg text-ink" onClick={onDelete}>
          <DeleteIcon />
        </button>
        <button type="button" aria-label={`테마, 현재 ${themeLabel[theme]}`} className="inline-flex size-10 items-center justify-center rounded-lg text-ink" onClick={cycleTheme}>
          <ThemeIcon />
        </button>
      </div>
    </header>
  );
}