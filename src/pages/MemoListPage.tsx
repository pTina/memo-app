import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BulkDeleteBar } from '@/features/memo/components/BulkDeleteBar';
import { ListHeader } from '@/features/memo/components/ListHeader';
import { MemoGrid } from '@/features/memo/components/MemoGrid';
import { SortSelect } from '@/features/memo/components/SortSelect';
import { useMemoMutations } from '@/features/memo/hooks/useMemoMutations';
import { useMemos } from '@/features/memo/hooks/useMemos';
import { createMemo } from '@/features/memo/utils/createMemo';
import { SettingsModal } from '@/features/settings/components/SettingsModal';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { useTrashMutations } from '@/features/trash/hooks/useTrashMutations';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import { Toast } from '@/shared/ui/Toast';
import { useUiStore } from '@/store/useUiStore';

export function MemoListPage() {
  const navigate = useNavigate();
  const { data: settingsData } = useSettings();
  const settings = settingsData ?? readSettingsSync();
  const searchQuery = useUiStore((state) => state.searchQuery);
  const selectedIds = useUiStore((state) => state.selectedIds);
  const activeModal = useUiStore((state) => state.activeModal);
  const setActiveModal = useUiStore((state) => state.setActiveModal);
  const setSelectedIds = useUiStore((state) => state.setSelectedIds);
  const toggleSelectedId = useUiStore((state) => state.toggleSelectedId);
  const memosQuery = useMemos(settings.sortBy, searchQuery);
  const { save, softDelete, softDeleteMany } = useMemoMutations();
  const { restore } = useTrashMutations();
  const [undoIds, setUndoIds] = useState<string[] | null>(null);
  const memos = memosQuery.data ?? [];

  useEffect(() => {
    if (!memosQuery.data) return;
    const visible = new Set(memosQuery.data.map((memo) => memo.id));
    const next = selectedIds.filter((id) => visible.has(id));
    if (next.length !== selectedIds.length) setSelectedIds(next);
  }, [memosQuery.data, selectedIds, setSelectedIds]);

  useEffect(() => {
    if (!undoIds) return undefined;
    const timer = window.setTimeout(() => setUndoIds(null), 5000);
    return () => window.clearTimeout(timer);
  }, [undoIds]);

  function trashMemos(ids: string[]) {
    if (ids.length === 0) return;
    const onSuccess = () => {
      setSelectedIds(selectedIds.filter((id) => !ids.includes(id)));
      setUndoIds(ids);
    };
    if (ids.length === 1) softDelete.mutate(ids[0], { onSuccess });
    else softDeleteMany.mutate(ids, { onSuccess });
  }

  function onCreate() {
    const memo = createMemo(settings.defaultFontId);
    save.mutate(memo, {
      onSuccess: (saved) => navigate(`/memos/${saved.id}`),
    });
  }

  function undoTrash() {
    if (!undoIds) return;
    for (const id of undoIds) restore.mutate(id);
    setUndoIds(null);
  }

  const searching = searchQuery.trim().length > 0;
  let status = '';
  if (memosQuery.isPending) status = '메모를 불러오는 중입니다.';
  else if (memosQuery.isError) status = '메모를 불러오지 못했습니다.';
  else if (memos.length === 0 && searching) status = '검색 결과가 없습니다.';
  else if (memos.length === 0) status = '아직 메모가 없습니다.';

  return (
    <main className="relative z-10 mx-auto min-h-full max-w-6xl bg-canvas px-4 py-6 text-ink lg:px-8">
      <ListHeader creating={save.isPending} onCreate={onCreate} onSettings={() => setActiveModal('settings')} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SortSelect />
        <BulkDeleteBar
          count={selectedIds.length}
          disabled={selectedIds.length === 0 || softDeleteMany.isPending}
          onDelete={() => trashMemos(selectedIds)}
        />
      </div>
      {status ? <p className="mt-8 text-sm text-muted">{status}</p> : null}
      <div className="mt-4">
        <MemoGrid memos={memos} selectedIds={selectedIds} onToggle={toggleSelectedId} onTrash={(id) => trashMemos([id])} />
      </div>
      {activeModal === 'settings' ? <SettingsModal onClose={() => setActiveModal(null)} /> : null}
      {undoIds ? (
        <Toast
          message={undoIds.length > 1 ? `${undoIds.length}개 메모를 휴지통으로 옮겼습니다.` : '메모를 휴지통으로 옮겼습니다.'}
          actionLabel="실행 취소"
          onAction={undoTrash}
          onClose={() => setUndoIds(null)}
        />
      ) : null}
    </main>
  );
}
