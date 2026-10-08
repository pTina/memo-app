import { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { normalizeHttpUrl } from '../utils/normalizeHttpUrl';

type LinkPopoverProps = {
  editor: Editor;
  onClose: () => void;
};

export function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const current = editor.getAttributes('link').href;
  const [value, setValue] = useState(typeof current === 'string' ? current : '');
  const [error, setError] = useState('');

  function apply() {
    const href = normalizeHttpUrl(value);
    if (!href) {
      setError('http 또는 https 주소만 사용할 수 있습니다.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
    }).run();
    onClose();
  }

  return (
    <form
      className="flex w-64 flex-col gap-2 p-2"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <label className="text-sm text-muted" htmlFor="memo-link-url">링크 주소</label>
      <input
        id="memo-link-url"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError('');
        }}
        placeholder="https://"
        className="rounded-lg border border-line-strong bg-paper px-2 py-1 text-sm text-ink outline-none"
      />
      {error ? <p className="text-sm text-ink">{error}</p> : null}
      <div className="flex justify-end gap-2">
        {editor.isActive('link') ? (
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-ink"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              onClose();
            }}
          >
            제거
          </button>
        ) : null}
        <button type="submit" className="rounded-lg border border-line-strong px-2 py-1 text-sm text-ink">
          적용
        </button>
      </div>
    </form>
  );
}