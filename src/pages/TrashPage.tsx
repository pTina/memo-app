import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyTrashDialog } from '@/features/trash/components/EmptyTrashDialog';
import { TrashList } from '@/features/trash/components/TrashList';
import { useTrash } from '@/features/trash/hooks/useTrash';
import { useTrashMutations } from '@/features/trash/hooks/useTrashMutations';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { SelectAllCheckbox } from '@/shared/ui/SelectAllCheckbox';
import { BackIcon, DeleteIcon } from '@/shared/ui/icons';
import type { Memo } from '@/shared/types';

export function TrashPage() {
  const trashQuery = useTrash();
  const { restore, remove, empty } = useTrashMutations();
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Memo[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const memos = trashQuery.data ?? [];
  const visible = new Set(memos.map((memo) => memo.id));
  const selected = selectedIds.filter((id) => visible.has(id));

  const loading = trashQuery.isLoading;
  let status = '';
  if (loading) status = '휴지통을 불러오는 중입니다.';
  else if (trashQuery.isError) status = '휴지통을 불러오지 못했습니다.';
  else if (memos.length === 0) status = '휴지통이 비어 있습니다.';
  else status = `삭제한 메모 ${memos.length}개`;

  function toggle(id: string) {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  function restoreSelected() {
    for (const id of selected) restore.mutate(id);
    setSelectedIds([]);
  }

  return (
    <main className="relative z-10 mx-auto min-h-full max-w-3xl bg-canvas px-4 py-6 text-ink lg:px-8">
      <header className="flex flex-wrap items-center gap-2">
        <Link to="/" aria-label="목록" className="inline-flex size-10 items-center justify-center rounded-lg text-ink">
          <BackIcon />
        </Link>
        <h1 className="flex-1 text-xl">휴지통</h1>
        <button
          type="button"
          disabled={memos.length === 0 || empty.isPending}
          className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => setEmptyOpen(true)}
        >
          휴지통 비우기
        </button>
      </header>
      {status ? <p className="mt-4 text-sm text-muted">{status}</p> : null}
      {!loading && memos.length > 0 ? (
        <p className="mt-2 text-sm text-muted">삭제한 메모는 30일 후 자동으로 영구 삭제됩니다.</p>
      ) : null}
      {memos.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SelectAllCheckbox
            total={memos.length}
            selected={selected.length}
            onToggle={() => {
              const allSelected = selected.length === memos.length;
              setSelectedIds(allSelected ? [] : memos.map((memo) => memo.id));
            }}
          />
          <button
            type="button"
            disabled={selected.length === 0}
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40"
            onClick={restoreSelected}
          >
            선택 복원{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPendingDelete(memos.filter((memo) => selected.includes(memo.id)))}
          >
            선택 삭제{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>
      ) : null}
      <TrashList
        memos={memos}
        selectedIds={selected}
        onToggle={toggle}
        onRestore={(id) => restore.mutate(id)}
        onDelete={(memo) => setPendingDelete([memo])}
      />
      {emptyOpen ? (
        <EmptyTrashDialog
          onClose={() => setEmptyOpen(false)}
          onConfirm={() => {
            empty.mutate(undefined, { onSuccess: () => {
              setEmptyOpen(false);
              setSelectedIds([]);
            } });
          }}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="영구 삭제"
          description={pendingDelete.length > 1 ? `선택한 ${pendingDelete.length}개 메모는 복원할 수 없습니다.` : '이 메모는 복원할 수 없습니다.'}
          confirmLabel="영구 삭제"
          confirmIcon={<DeleteIcon className="text-sunday" />}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const ids = pendingDelete.map((memo) => memo.id);
            remove.mutate(ids, {
              onSuccess: () => {
                setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
                setPendingDelete(null);
              },
            });
          }}
        />
      ) : null}
    </main>
  );
}