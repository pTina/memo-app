import type { JSONContent } from '@tiptap/core';

export type MemoSummary = {
  id: string;
  title: string;
  plainText: string;
  fontId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Memo = MemoSummary & {
  content: JSONContent;
};

export function toMemoSummary(memo: Memo | MemoSummary): MemoSummary {
  return {
    id: memo.id,
    title: memo.title,
    plainText: memo.plainText,
    fontId: memo.fontId,
    createdAt: memo.createdAt,
    updatedAt: memo.updatedAt,
    deletedAt: memo.deletedAt,
  };
}
