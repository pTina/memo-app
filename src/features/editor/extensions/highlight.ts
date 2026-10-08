import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tokenHighlight: {
      setTokenHighlight: (highlight: string) => ReturnType;
      unsetTokenHighlight: () => ReturnType;
    };
  }
}

export const TokenHighlight = Mark.create({
  name: 'tokenHighlight',
  addAttributes() {
    return {
      highlight: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-highlight'),
        renderHTML: (attributes) => (attributes.highlight ? { 'data-highlight': attributes.highlight } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-highlight]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setTokenHighlight: (highlight) => ({ commands }) => commands.setMark(this.name, { highlight }),
      unsetTokenHighlight: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});
