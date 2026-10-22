import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { AccountMenu } from '@/features/auth/components/AccountMenu';
import { useTheme } from '@/features/theme/hooks/useTheme';
import { usesCloudStorage } from '@/shared/lib/firebase';
import { MoonIcon, MoreIcon, PlusIcon, SettingsIcon, SunIcon, TrashIcon } from '@/shared/ui/icons';
import { SearchInput } from './SearchInput';

const themeLabel = { system: '시스템', light: '라이트', dark: '다크' } as const;
const themeOrder = ['system', 'light', 'dark'] as const;

type ListHeaderProps = {
  creating: boolean;
  onCreate: () => void;
  onSettings: () => void;
};

export function ListHeader({ creating, onCreate, onSettings }: ListHeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const ThemeIcon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  function cycleTheme() {
    const index = themeOrder.indexOf(theme);
    setTheme(themeOrder[(index + 1) % themeOrder.length]);
  }

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      moreRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || moreRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const iconButton = 'inline-flex size-10 items-center justify-center rounded-lg text-ink';

  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-xl">메모장</h1>
      <SearchInput />
      <div className="hidden items-center gap-1 lg:flex">
        <Link to="/trash" aria-label="휴지통" className={iconButton}>
          <TrashIcon />
        </Link>
        <button type="button" aria-label="설정" className={iconButton} onClick={onSettings}>
          <SettingsIcon />
        </button>
        <button type="button" aria-label={`테마, 현재 ${themeLabel[theme]}`} className={iconButton} onClick={cycleTheme}>
          <ThemeIcon />
        </button>
        {usesCloudStorage() ? <AccountMenu /> : null}
      </div>
      <div className="flex items-center gap-1 lg:hidden">
        {usesCloudStorage() ? <AccountMenu /> : null}
      <div className="relative" ref={menuRef}>
        <button
          ref={moreRef}
          type="button"
          aria-label="더보기"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          className={iconButton}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreIcon />
        </button>
        {menuOpen ? (
          <div id={menuId} className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-line-strong bg-paper p-1 shadow-panel">
            <Link to="/trash" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink" onClick={() => setMenuOpen(false)}>
              <TrashIcon />
              휴지통
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink"
              onClick={() => {
                setMenuOpen(false);
                onSettings();
              }}
            >
              <SettingsIcon />
              설정
            </button>
            <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink" onClick={cycleTheme}>
              <ThemeIcon />
              테마: {themeLabel[theme]}
            </button>
          </div>
        ) : null}
      </div>
      </div>
      <button
        type="button"
        disabled={creating}
        onClick={onCreate}
        className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:opacity-40"
      >
        <PlusIcon />
        새 메모
      </button>
    </header>
  );
}
