import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface PublishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  workflowToPublish: { id: number; description: string } | null;
  currentlyPublished: { id: number; description: string } | null;
}

export function PublishConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  workflowToPublish,
  currentlyPublished,
}: PublishConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>다른 워크플로우가 이미 배포되어 있습니다</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>현재 배포됨:</strong> #{currentlyPublished?.id} "{currentlyPublished?.description}"
            </p>
            <p>
              <strong>새로 배포할 워크플로우:</strong> #{workflowToPublish?.id} "{workflowToPublish?.description}"
            </p>
            <p className="text-yellow-600 font-medium mt-4">
              ⚠️ 같은 타입과 제품에는 하나의 워크플로우만 배포할 수 있습니다.
            </p>
            <p>
              계속하시면 기존 워크플로우의 배포가 취소되고 새 워크플로우가 배포됩니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            배포 진행
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
