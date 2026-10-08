import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyTrashDialog } from '@/features/trash/components/EmptyTrashDialog';
import { TrashList } from '@/features/trash/components/TrashList';
import { useTrash } from '@/features/trash/hooks/useTrash';
import { useTrashMutations } from '@/features/trash/hooks/useTrashMutations';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { BackIcon, DeleteIcon } from '@/shared/ui/icons';
import type { Memo } from '@/shared/types';

export function TrashPage() {
  const trashQuery = useTrash();
  const { restore, remove, empty } = useTrashMutations();
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Memo | null>(null);
  const memos = trashQuery.data ?? [];

  let status = '';
  if (trashQuery.isPending) status = '휴지통을 불러오는 중입니다.';
  else if (trashQuery.isError) status = '휴지통을 불러오지 못했습니다.';
  else if (memos.length === 0) status = '휴지통이 비어 있습니다.';

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
      <p className="mt-4 text-sm text-muted">삭제한 메모는 30일 후 자동으로 영구 삭제됩니다.</p>
      {status ? <p className="mt-8 text-sm text-muted">{status}</p> : null}
      <TrashList memos={memos} onRestore={(id) => restore.mutate(id)} onDelete={setPendingDelete} />
      {emptyOpen ? (
        <EmptyTrashDialog
          onClose={() => setEmptyOpen(false)}
          onConfirm={() => {
            empty.mutate(undefined, { onSuccess: () => setEmptyOpen(false) });
          }}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="영구 삭제"
          description="이 메모는 복원할 수 없습니다."
          confirmLabel="영구 삭제"
          confirmIcon={<DeleteIcon className="text-sunday" />}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
          }}
        />
      ) : null}
    </main>
  );
}