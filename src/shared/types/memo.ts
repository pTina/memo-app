import type { JSONContent } from '@tiptap/core';

export type Memo = {
  id: string;
  title: string;
  content: JSONContent;
  plainText: string;
  fontId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
