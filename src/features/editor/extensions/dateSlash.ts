import { Extension, InputRule } from '@tiptap/core';
import { formatInsertedDate } from '@/shared/lib/dateUtils';

export function DateSlash(getWithTime: () => boolean) {
  return Extension.create({
    name: 'dateSlash',
    addInputRules() {
      return [
        new InputRule({
          find: /\/$/,
          handler: ({ state, range, chain }) => {
            const $from = state.doc.resolve(range.from);
            if ($from.parentOffset > 0) {
              const prev = $from.parent.textBetween($from.parentOffset - 1, $from.parentOffset);
              if (!/\s/.test(prev)) return null;
            }
            chain().deleteRange(range).insertContent(formatInsertedDate(new Date(), getWithTime())).run();
            return undefined;
          },
        }),
      ];
    },
  });
}