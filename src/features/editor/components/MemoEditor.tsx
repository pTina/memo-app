import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { FontManagerModal } from '@/features/font/components/FontManagerModal';
import { useReadyFontFamily } from '@/features/font/hooks/useFontFace';
import { useFonts } from '@/features/font/hooks/useFonts';
import { upsertMemoCaches } from '@/features/memo/hooks/memoCache';
import { useMemoMutations } from '@/features/memo/hooks/useMemoMutations';
import { clearDraft, isDraft } from '@/features/memo/utils/draftMemos';
import { formatMemoDateTime } from '@/shared/lib/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/store/useUiStore';
import type { Memo } from '@/shared/types';
import { isSafeHttpUrl } from '../utils/normalizeHttpUrl';
import { DateSlash } from '../extensions/dateSlash';
import { LetterSpacing } from '../extensions/letterSpacing';
import { LineHeight } from '../extensions/lineHeight';
import { ResizableImage } from '../extensions/resizableImage';
import { TextColor } from '../extensions/textColor';
import { TokenHighlight } from '../extensions/highlight';
import { fileToEditorImage, getClipboardImageFile, readClipboardImage } from '../utils/readClipboardImage';
import { EditorHeader } from './EditorHeader';
import { EditorToolbar } from './EditorToolbar';

type MemoEditorProps = {
  memo: Memo;
  dateWithTime: boolean;
  onDeleted: () => void;
};

export function MemoEditor({ memo, dateWithTime, onDeleted }: MemoEditorProps) {
  const queryClient = useQueryClient();
  const { save, softDelete } = useMemoMutations();
  const { data: fonts } = useFonts();
  const activeModal = useUiStore((state) => state.activeModal);
  const setActiveModal = useUiStore((state) => state.setActiveModal);
  const [title, setTitle] = useState(memo.title);
  const [fontId, setFontId] = useState(memo.fontId);
  const [draft, setDraft] = useState(() => isDraft(memo.id));
  const fontFamily = useReadyFontFamily(fontId);
  const [updatedAt, setUpdatedAt] = useState(memo.updatedAt);
  const titleRef = useRef(memo.title);
  const memoRef = useRef(memo);
  const draftRef = useRef<Memo | null>(null);
  const timerRef = useRef<number | null>(null);
  const saveRef = useRef(save.mutate);
  const draftFlagRef = useRef(draft);
  const deletedRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const dateWithTimeRef = useRef(dateWithTime);
  saveRef.current = save.mutate;
  draftFlagRef.current = draft;
  dateWithTimeRef.current = dateWithTime;
  const dateSlash = useMemo(() => DateSlash(() => dateWithTimeRef.current), []);

  function currentMemo(overrides: Partial<Memo> = {}): Memo {
    return {
      ...memoRef.current,
      title: titleRef.current,
      content: overrides.content ?? memoRef.current.content,
      plainText: overrides.plainText ?? memoRef.current.plainText,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function persistNow() {
    if (deletedRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const next = currentMemo({
      title: titleRef.current,
      content: editorRef.current?.getJSON() ?? memoRef.current.content ?? { type: 'doc', content: [] },
      plainText: editorRef.current?.getText() ?? memoRef.current.plainText ?? '',
    });
    draftRef.current = null;
    memoRef.current = next;
    setUpdatedAt(next.updatedAt);
    clearDraft(memo.id);
    setDraft(false);
    upsertMemoCaches(queryClient, next);
    saveRef.current(next);
  }

  function flush() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (draftFlagRef.current) {
      persistNow();
      return;
    }
    const next = draftRef.current;
    if (!next) return;
    draftRef.current = null;
    memoRef.current = next;
    upsertMemoCaches(queryClient, next);
    saveRef.current(next);
  }

  function queueSave(next: Memo) {
    draftRef.current = next;
    memoRef.current = next;
    setUpdatedAt(next.updatedAt);
    queryClient.setQueryData(['memo', next.id], next);
    if (draftFlagRef.current) return;
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
      ResizableImage.configure({ allowBase64: true, inline: false }),
    ],
    content: memo.content,
    editorProps: {
      attributes: {
        class: 'memo-editor min-h-64 py-4 text-base text-ink outline-none',
        'aria-label': '본문',
      },
      handlePaste: (_view, event) => {
        const image = getClipboardImageFile(event.clipboardData);
        if (!image) return false;
        event.preventDefault();
        void fileToEditorImage(image).then((src) => {
          if (src) editorRef.current?.chain().focus().setImage({ src }).run();
        });
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      queueSave(currentMemo({
        content: current.getJSON(),
        plainText: current.getText(),
      }));
    },
  });
  editorRef.current = editor;

  function persist() {
    persistNow();
  }

  useEffect(() => {
    setFontId(memo.fontId);
    memoRef.current = { ...memoRef.current, fontId: memo.fontId };
  }, [memo.fontId]);

  useEffect(() => () => {
    flush();
  }, []);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (activeModal) return;
      const syncFile = getClipboardImageFile(event.clipboardData);
      if (syncFile) {
        event.preventDefault();
        void fileToEditorImage(syncFile).then((src) => {
          if (src) editorRef.current?.chain().focus().setImage({ src }).run();
        });
        return;
      }
      if (event.clipboardData?.getData('text/plain')) return;
      event.preventDefault();
      void readClipboardImage(event.clipboardData).then(async (file) => {
        if (!file) return;
        const src = await fileToEditorImage(file);
        if (src) editorRef.current?.chain().focus().setImage({ src }).run();
      });
    }
    document.addEventListener('paste', onPaste, true);
    return () => document.removeEventListener('paste', onPaste, true);
  }, [activeModal]);

  function onFontChange(nextId: string | null) {
    setFontId(nextId);
    queueSave(currentMemo({
      fontId: nextId,
      content: editor?.getJSON() ?? memoRef.current.content,
      plainText: editor?.getText() ?? memoRef.current.plainText,
    }));
  }

  function onTitle(value: string) {
    titleRef.current = value;
    setTitle(value);
    queueSave(currentMemo({
      content: editor?.getJSON() ?? memoRef.current.content,
      plainText: editor?.getText() ?? memoRef.current.plainText,
    }));
  }

  function onDelete() {
    deletedRef.current = true;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    draftRef.current = null;
    if (draftFlagRef.current) {
      clearDraft(memo.id);
      queryClient.removeQueries({ queryKey: ['memo', memo.id] });
      onDeleted();
      return;
    }
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
        onSave={draft ? persist : undefined}
        onLeave={persistNow}
        saving={save.isPending}
      />
      <input
        value={title}
        onChange={(event) => onTitle(event.target.value)}
        placeholder="제목"
        aria-label="제목"
        className="mt-6 w-full rounded-lg bg-transparent px-1 py-2 text-2xl text-ink outline-none placeholder:text-faint focus-visible:outline-none"
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