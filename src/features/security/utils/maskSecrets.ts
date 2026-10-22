import type { JSONContent } from '@tiptap/core';
import { secretRegexes } from './secretPatterns';

function maskMatch(value: string) {
  if (value.length <= 4) return '••••';
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(value.length - 4, 8))}`;
}

export function maskSecrets(text: string) {
  let next = text;
  for (const { regex } of secretRegexes()) {
    next = next.replace(new RegExp(regex.source, 'g'), (match) => maskMatch(match));
  }
  return next;
}

function maskNode(node: JSONContent): JSONContent {
  const next: JSONContent = { ...node };
  if (typeof next.text === 'string') next.text = maskSecrets(next.text);
  if (Array.isArray(next.content)) next.content = next.content.map(maskNode);
  return next;
}

export function maskMemoFields<T extends { title: string; plainText: string; content: JSONContent }>(memo: T): T {
  return {
    ...memo,
    title: maskSecrets(memo.title),
    plainText: maskSecrets(memo.plainText),
    content: maskNode(memo.content),
  };
}