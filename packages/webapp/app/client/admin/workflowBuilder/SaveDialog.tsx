import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (description: string) => void;
  initialDescription?: string;
}

export function SaveDialog({
  open,
  onOpenChange,
  onSave,
  initialDescription = "",
}: SaveDialogProps) {
  const [description, setDescription] = useState(initialDescription);

  // open될 때마다 initialDescription으로 다시 설정
  useEffect(() => {
    if (open) {
      setDescription(initialDescription);
    }
  }, [open, initialDescription]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!description.trim()) {
      alert("설명을 입력해주세요");
      return;
    }
    onSave(description);
    onOpenChange(false);
  };

  // 엔터 키 감지
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter 또는 Cmd+Enter는 기본 동작 유지
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        // Shift+Enter가 아닌 일반 Enter만 처리
        const target = e.target as HTMLElement;
        // Input 필드에 포커스가 있을 때만 처리
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          e.preventDefault();
          if (!description.trim()) {
            alert("설명을 입력해주세요");
            return;
          }
          onSave(description);
          onOpenChange(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, description, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>워크플로우 저장</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="워크플로우 설명을 입력하세요"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
