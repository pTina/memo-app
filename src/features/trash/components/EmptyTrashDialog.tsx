import { DeleteIcon } from '@/shared/ui/icons';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

type EmptyTrashDialogProps = {
  onConfirm: () => void;
  onClose: () => void;
};

export function EmptyTrashDialog({ onConfirm, onClose }: EmptyTrashDialogProps) {
  return (
    <ConfirmDialog
      title="휴지통 비우기"
      description="휴지통의 메모가 모두 영구 삭제됩니다."
      confirmLabel="비우기"
      confirmIcon={<DeleteIcon className="text-sunday" />}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
