import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "./ui/button";

interface CustomModalProps {
  onOpen?: boolean;
  onClose?: () => void;

  // content
  title: string;
  subTitle: string;
  children: ReactNode;
  onClick?: () => void;
  buttonText?: string;
  formId?: string;
}

export const CustomModal = (props: CustomModalProps) => {
  const { onOpen, onClose } = props;
  const { title, subTitle, children, onClick, buttonText = "저장" } = props;
  const { formId } = props;

  return (
    <Dialog open={onOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subTitle}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onClick}
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
