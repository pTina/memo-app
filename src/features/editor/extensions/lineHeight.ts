import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (height: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Mark.create({
  name: 'lineHeight',
  addAttributes() {
    return {
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-line-height'),
        renderHTML: (attributes) => (attributes.height ? { 'data-line-height': attributes.height } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-line-height]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setLineHeight: (height) => ({ commands }) => commands.setMark(this.name, { height }),
      unsetLineHeight: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});
