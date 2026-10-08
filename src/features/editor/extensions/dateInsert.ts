import type { Editor } from '@tiptap/core';
import { formatInsertedDate } from '@/shared/lib/dateUtils';

export function insertDate(editor: Editor, withTime: boolean) {
  const text = formatInsertedDate(new Date(), withTime);
  const { to } = editor.state.selection;
  editor.chain().focus().setTextSelection(to).insertContent(text).run();
}