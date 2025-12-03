import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const GROUP_COLORS = [
  { name: "초록", value: "#22c55e" },
  { name: "파랑", value: "#3b82f6" },
  { name: "빨강", value: "#ef4444" },
  { name: "노랑", value: "#eab308" },
  { name: "보라", value: "#a855f7" },
  { name: "주황", value: "#f97316" },
  { name: "회색", value: "#6b7280" },
];

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (label: string, color: string) => void;
  initialLabel?: string;
  initialColor?: string;
  mode?: "create" | "edit";
}

export function GroupDialog({
  open,
  onOpenChange,
  onSave,
  initialLabel = "",
  initialColor = GROUP_COLORS[0].value,
  mode = "create",
}: GroupDialogProps) {
  const [label, setLabel] = React.useState(initialLabel);
  const [color, setColor] = React.useState(initialColor);

  React.useEffect(() => {
    if (open) {
      setLabel(initialLabel);
      setColor(initialColor);
    }
  }, [open, initialLabel, initialColor]);

  const handleSave = () => {
    if (!label.trim()) {
      return;
    }
    onSave(label.trim(), color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "그룹 만들기" : "그룹 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-label">그룹 이름</Label>
            <Input
              id="group-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 로그인 처리"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label>색상</Label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    border:
                      color === c.value
                        ? "3px solid #000"
                        : "2px solid transparent",
                    boxShadow:
                      color === c.value
                        ? "0 0 0 2px white, 0 0 0 4px " + c.value
                        : "none",
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>미리보기</Label>
            <div
              style={{
                backgroundColor: `${color}15`,
                border: `2px dashed ${color}`,
                borderRadius: 8,
                padding: "24px 16px 16px",
                position: "relative",
                minHeight: 60,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: 8,
                  backgroundColor: color,
                  color: "white",
                  padding: "2px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {label || "그룹 이름"}
              </div>
              <div className="text-sm text-gray-400 text-center">
                선택된 노드들이 여기에 포함됩니다
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {mode === "create" ? "만들기" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
