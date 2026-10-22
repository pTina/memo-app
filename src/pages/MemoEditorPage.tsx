import { Link, useNavigate, useParams } from 'react-router';
import { MemoEditor } from '@/features/editor/components/MemoEditor';
import { useMemo } from '@/features/memo/hooks/useMemo';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { readSettingsSync } from '@/shared/storage/localAdapter';
import { BackIcon } from '@/shared/ui/icons';

export function MemoEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const memoQuery = useMemo(id);
  const { data: settings } = useSettings();
  const dateWithTime = (settings ?? readSettingsSync()).dateWithTime;
  const memo = memoQuery.data;

  if (!memo && memoQuery.isPending) {
    return (
      <main className="relative z-10 mx-auto min-h-full max-w-3xl bg-canvas px-4 py-6 text-ink lg:px-8">
        <p className="text-sm text-muted">메모를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (!memo || memo.deletedAt) {
    return (
      <main className="relative z-10 mx-auto min-h-full max-w-3xl bg-canvas px-4 py-6 text-ink lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink">
          <BackIcon />
          목록
        </Link>
        <p className="mt-6 text-sm text-muted">{memo?.deletedAt ? '휴지통에 있는 메모입니다.' : '메모를 찾을 수 없습니다.'}</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto min-h-full max-w-3xl bg-canvas px-4 py-6 text-ink lg:px-8">
      <MemoEditor key={memo.id} memo={memo} dateWithTime={dateWithTime} onDeleted={() => navigate('/')} />
    </main>
  );
}