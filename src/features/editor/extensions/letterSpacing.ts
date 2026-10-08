import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterSpacing: {
      setLetterSpacing: (spacing: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
    };
  }
}

export const LetterSpacing = Mark.create({
  name: 'letterSpacing',
  addAttributes() {
    return {
      spacing: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-letter-spacing'),
        renderHTML: (attributes) => (attributes.spacing ? { 'data-letter-spacing': attributes.spacing } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-letter-spacing]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setLetterSpacing: (spacing) => ({ commands }) => commands.setMark(this.name, { spacing }),
      unsetLetterSpacing: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});
