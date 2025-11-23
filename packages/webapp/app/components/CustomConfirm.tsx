import type { ReactNode } from "react";
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
import { cn } from "~/lib/utils";

interface CustomConfirmProps {
  onOpen?: boolean;
  onClose?: () => void;

  // content
  title: string;
  content: ReactNode;
  onClick?: () => void;
  type: "delete" | "basic" | "save";
}

export const CustomConfirm = (props: CustomConfirmProps) => {
  const { onOpen, onClose } = props;
  const { title, content, onClick, type } = props;

  const buttonText =
    type === "delete" ? "삭제" : type === "basic" ? "확인" : "저장";

  return (
    <AlertDialog open={onOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onClick}
            className={cn({
              "bg-red-600 hover:bg-red-700": type === "delete",
              "bg-primary-700 hover:bg-primary-800":
                type === "basic" || type === "save",
            })}
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
