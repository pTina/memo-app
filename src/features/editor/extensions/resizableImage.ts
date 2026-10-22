import Image from '@tiptap/extension-image';
import type { EditorView } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from '../components/ResizableImageView';
import { fileToEditorImage, getClipboardImageFile } from '../utils/readClipboardImage';

function insertImage(view: EditorView, src: string) {
  const type = view.state.schema.nodes.image;
  if (!type) return;
  view.dispatch(view.state.tr.replaceSelectionWith(type.create({ src })));
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('width');
          return value ? Number(value) : null;
        },
        renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteClipboardImage'),
        props: {
          handlePaste(view, event) {
            const file = getClipboardImageFile(event.clipboardData);
            if (!file) return false;
            event.preventDefault();
            void fileToEditorImage(file).then((src) => {
              if (src) insertImage(view, src);
            });
            return true;
          },
        },
      }),
      ...(this.parent?.() ?? []),
    ];
  },
});