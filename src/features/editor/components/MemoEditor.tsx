import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { FontManagerModal } from '@/features/font/components/FontManagerModal';
import { useReadyFontFamily } from '@/features/font/hooks/useFontFace';
import { useFonts } from '@/features/font/hooks/useFonts';
import { useMemoMutations } from '@/features/memo/hooks/useMemoMutations';
import { formatMemoDateTime } from '@/shared/lib/dateUtils';
import { useUiStore } from '@/store/useUiStore';
import type { Memo } from '@/shared/types';
import { isSafeHttpUrl } from '../utils/normalizeHttpUrl';
import { DateSlash } from '../extensions/dateSlash';
import { LetterSpacing } from '../extensions/letterSpacing';
import { LineHeight } from '../extensions/lineHeight';
import { TextColor } from '../extensions/textColor';
import { TokenHighlight } from '../extensions/highlight';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';

type MemoEditorProps = {
  memo: Memo;
  dateWithTime: boolean;
  onDeleted: () => void;
};

export function MemoEditor({ memo, dateWithTime, onDeleted }: MemoEditorProps) {
  const { save, softDelete } = useMemoMutations();
  const { data: fonts } = useFonts();
  const activeModal = useUiStore((state) => state.activeModal);
  const setActiveModal = useUiStore((state) => state.setActiveModal);
  const [title, setTitle] = useState(memo.title);
  const [fontId, setFontId] = useState(memo.fontId);
  const fontFamily = useReadyFontFamily(fontId);
  const [updatedAt, setUpdatedAt] = useState(memo.updatedAt);
  const titleRef = useRef(memo.title);
  const memoRef = useRef(memo);
  const draftRef = useRef<Memo | null>(null);
  const timerRef = useRef<number | null>(null);
  const saveRef = useRef(save.mutate);
  const dateWithTimeRef = useRef(dateWithTime);
  saveRef.current = save.mutate;
  dateWithTimeRef.current = dateWithTime;
  const dateSlash = useMemo(() => DateSlash(() => dateWithTimeRef.current), []);

  function flush() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const draft = draftRef.current;
    if (!draft) return;
    draftRef.current = null;
    memoRef.current = draft;
    saveRef.current(draft);
  }

  function queueSave(next: Memo) {
    draftRef.current = next;
    setUpdatedAt(next.updatedAt);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flush, 500);
  }

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: 'https',
          protocols: ['http', 'https'],
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
          isAllowedUri: (url) => isSafeHttpUrl(url),
          shouldAutoLink: (url) => isSafeHttpUrl(url),
        },
      }),
      TextColor,
      TokenHighlight,
      LetterSpacing,
      LineHeight,
      dateSlash,
    ],
    content: memo.content,
    editorProps: {
      attributes: {
        class: 'memo-editor min-h-64 py-4 text-base text-ink outline-none',
        'aria-label': '본문',
      },
    },
    onUpdate: ({ editor: current }) => {
      queueSave({
        ...memoRef.current,
        title: titleRef.current,
        content: current.getJSON(),
        plainText: current.getText(),
        updatedAt: new Date().toISOString(),
      });
    },
  });

  useEffect(() => {
    setFontId(memo.fontId);
    memoRef.current = { ...memoRef.current, fontId: memo.fontId };
  }, [memo.fontId]);

  useEffect(() => () => {
    flush();
  }, []);

  function onFontChange(nextId: string | null) {
    setFontId(nextId);
    queueSave({
      ...memoRef.current,
      title: titleRef.current,
      fontId: nextId,
      content: editor?.getJSON() ?? memoRef.current.content,
      plainText: editor?.getText() ?? memoRef.current.plainText,
      updatedAt: new Date().toISOString(),
    });
  }

  function onTitle(value: string) {
    titleRef.current = value;
    setTitle(value);
    queueSave({
      ...memoRef.current,
      title: value,
      content: editor?.getJSON() ?? memoRef.current.content,
      plainText: editor?.getText() ?? memoRef.current.plainText,
      updatedAt: new Date().toISOString(),
    });
  }

  function onDelete() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    draftRef.current = null;
    softDelete.mutate(memo.id, { onSuccess: () => onDeleted() });
  }

  const fontStyle = fontFamily ? { fontFamily } : undefined;

  return (
    <div style={fontStyle}>
      <EditorHeader
        fonts={fonts ?? []}
        fontId={fontId}
        onFontChange={onFontChange}
        onManageFonts={() => setActiveModal('fonts')}
        onDelete={onDelete}
      />
      <input
        value={title}
        onChange={(event) => onTitle(event.target.value)}
        placeholder="제목"
        aria-label="제목"
        className="mt-6 w-full bg-transparent text-2xl text-ink outline-none placeholder:text-faint"
      />
      <p className="mt-2 text-sm text-muted">
        생성 {formatMemoDateTime(memo.createdAt)} · 수정 {formatMemoDateTime(updatedAt)}
      </p>
      {editor ? (
        <BubbleMenu
          editor={editor}
          updateDelay={0}
          options={{ placement: 'top', offset: 8 }}
          shouldShow={({ editor: current, from, to }) => current.isEditable && current.isFocused && from !== to}
        >
          <EditorToolbar editor={editor} dateWithTime={dateWithTime} />
        </BubbleMenu>
      ) : null}
      <EditorContent editor={editor} />
      {activeModal === 'fonts' ? <FontManagerModal onClose={() => setActiveModal(null)} /> : null}
    </div>
  );
}