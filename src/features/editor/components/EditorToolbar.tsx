import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { CalendarIcon, HighlightIcon, LetterSpacingIcon, LineHeightIcon, LinkIcon, TextColorIcon } from '@/shared/ui/icons';
import { insertDate } from '../extensions/dateInsert';
import { LinkPopover } from './LinkPopover';

const textColors = [
  { id: 'ink', label: '본문', swatch: 'bg-ink' },
  { id: 'muted', label: '보조', swatch: 'bg-muted' },
  { id: 'sunday', label: '강조', swatch: 'bg-sunday' },
] as const;

const highlights = [
  { id: 'accent', label: '보라', swatch: 'bg-accent' },
  { id: 'work', label: '민트', swatch: 'bg-work' },
  { id: 'personal', label: '파랑', swatch: 'bg-personal' },
  { id: 'lemon', label: '노랑', swatch: 'bg-lemon' },
] as const;

const spacingOptions = [
  { id: 'tight', label: '좁게' },
  { id: 'normal', label: '기본' },
  { id: 'wide', label: '넓게' },
] as const;

type Panel = 'color' | 'highlight' | 'spacing' | 'line' | 'link' | null;

type EditorToolbarProps = {
  editor: Editor;
  dateWithTime: boolean;
};

const iconButton = 'inline-flex size-9 items-center justify-center rounded-lg text-ink aria-pressed:bg-accent';

export function EditorToolbar({ editor, dateWithTime }: EditorToolbarProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      color: current.getAttributes('textColor').color as string | null,
      highlight: current.getAttributes('tokenHighlight').highlight as string | null,
      spacing: current.getAttributes('letterSpacing').spacing as string | null,
      height: current.getAttributes('lineHeight').height as string | null,
      link: current.isActive('link'),
    }),
  });

  function toggle(next: Panel) {
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <div
      className="flex max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-line-strong bg-paper shadow-panel"
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest('input, textarea')) return;
        event.preventDefault();
      }}
    >
      <div className="flex items-center gap-0.5 p-1" role="toolbar" aria-label="선택 영역">
        <button type="button" className={iconButton} aria-label="글자색" aria-pressed={panel === 'color'} onClick={() => toggle('color')}>
          <TextColorIcon />
        </button>
        <button type="button" className={iconButton} aria-label="형광펜" aria-pressed={panel === 'highlight'} onClick={() => toggle('highlight')}>
          <HighlightIcon />
        </button>
        <button type="button" className={iconButton} aria-label="자간" aria-pressed={panel === 'spacing'} onClick={() => toggle('spacing')}>
          <LetterSpacingIcon />
        </button>
        <button type="button" className={iconButton} aria-label="행간" aria-pressed={panel === 'line'} onClick={() => toggle('line')}>
          <LineHeightIcon />
        </button>
        <button type="button" className={iconButton} aria-label="링크" aria-pressed={panel === 'link' || active.link} onClick={() => toggle('link')}>
          <LinkIcon />
        </button>
        <button
          type="button"
          className={iconButton}
          aria-label="날짜 삽입"
          onClick={() => {
            insertDate(editor, dateWithTime);
            setPanel(null);
          }}
        >
          <CalendarIcon />
        </button>
      </div>
      {panel === 'color' ? (
        <div className="flex items-center gap-1 border-t border-line px-2 py-2" role="group" aria-label="글자색">
          {textColors.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={`글자색 ${color.label}`}
              aria-pressed={active.color === color.id}
              className={`size-6 rounded-full ${color.swatch} outline-offset-2 outline-ink aria-pressed:outline-2`}
              onClick={() => {
                editor.chain().focus().setTextColor(color.id).run();
                setPanel(null);
              }}
            />
          ))}
          <button type="button" className="px-2 text-sm text-ink" onClick={() => { editor.chain().focus().unsetTextColor().run(); setPanel(null); }}>
            없음
          </button>
        </div>
      ) : null}
      {panel === 'highlight' ? (
        <div className="flex items-center gap-1 border-t border-line px-2 py-2" role="group" aria-label="형광펜">
          {highlights.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={`형광펜 ${color.label}`}
              aria-pressed={active.highlight === color.id}
              className={`size-6 rounded-full ${color.swatch} outline-offset-2 outline-ink aria-pressed:outline-2`}
              onClick={() => {
                editor.chain().focus().setTokenHighlight(color.id).run();
                setPanel(null);
              }}
            />
          ))}
          <button type="button" className="px-2 text-sm text-ink" onClick={() => { editor.chain().focus().unsetTokenHighlight().run(); setPanel(null); }}>
            없음
          </button>
        </div>
      ) : null}
      {panel === 'spacing' ? (
        <div className="flex items-center gap-1 border-t border-line px-2 py-2" role="group" aria-label="자간">
          {spacingOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === 'normal' ? !active.spacing : active.spacing === option.id}
              className="rounded-lg px-2 py-1 text-sm text-ink aria-pressed:bg-accent"
              onClick={() => {
                if (option.id === 'normal') editor.chain().focus().unsetLetterSpacing().run();
                else editor.chain().focus().setLetterSpacing(option.id).run();
                setPanel(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {panel === 'line' ? (
        <div className="flex items-center gap-1 border-t border-line px-2 py-2" role="group" aria-label="행간">
          {spacingOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === 'normal' ? !active.height : active.height === option.id}
              className="rounded-lg px-2 py-1 text-sm text-ink aria-pressed:bg-accent"
              onClick={() => {
                if (option.id === 'normal') editor.chain().focus().unsetLineHeight().run();
                else editor.chain().focus().setLineHeight(option.id).run();
                setPanel(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {panel === 'link' ? <LinkPopover editor={editor} onClose={() => setPanel(null)} /> : null}
    </div>
  );
}