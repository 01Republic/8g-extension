import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

interface WorkflowParametersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: WorkflowType;
  workspaceKey: string;
  setWorkspaceKey: (key: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  emails: string;
  setEmails: (emails: string) => void;
}

export function WorkflowParametersDialog({
  open,
  onOpenChange,
  type,
  workspaceKey,
  setWorkspaceKey,
  slug,
  setSlug,
  emails,
  setEmails,
}: WorkflowParametersDialogProps) {
  // 파라미터가 필요한 타입인지 확인
  const needsParameters = [
    "WORKSPACE_DETAIL",
    "MEMBERS",
    "ADD_MEMBERS",
    "DELETE_MEMBERS",
    "BILLING",
    "BILLING_HISTORIES",
  ].includes(type);

  if (!needsParameters) {
    return null;
  }

  const handleApply = () => {
    // 필수 값 검증
    if (!workspaceKey.trim()) {
      alert("Workspace Key를 입력해주세요");
      return;
    }
    if (!slug.trim()) {
      alert("Slug를 입력해주세요");
      return;
    }
    if (
      (type === "ADD_MEMBERS" || type === "DELETE_MEMBERS") &&
      !emails.trim()
    ) {
      alert("이메일을 입력해주세요");
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>워크플로우 파라미터 설정</DialogTitle>
          <DialogDescription>
            {type === "ADD_MEMBERS"
              ? "멤버 추가에 필요한 정보를 입력하세요"
              : type === "DELETE_MEMBERS"
                ? "멤버 삭제에 필요한 정보를 입력하세요"
                : "워크플로우 실행에 필요한 정보를 입력하세요"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workspaceKey">Workspace Key *</Label>
            <Input
              id="workspaceKey"
              value={workspaceKey}
              onChange={(e) => setWorkspaceKey(e.target.value)}
              placeholder="workspace-key"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="organization-slug"
            />
          </div>

          {(type === "ADD_MEMBERS" || type === "DELETE_MEMBERS") && (
            <div className="grid gap-2">
              <Label htmlFor="emails">Emails *</Label>
              <Input
                id="emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="user1@example.com, user2@example.com"
              />
              <p className="text-sm text-muted-foreground">
                여러 이메일은 쉼표(,)로 구분하세요
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleApply}>적용</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
