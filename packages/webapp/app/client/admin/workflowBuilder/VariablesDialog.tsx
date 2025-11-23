import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useState, useEffect } from "react";

interface VariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: Record<string, any>;
  onVariablesChange: (vars: Record<string, any>) => void;
}

export function VariablesDialog({
  open,
  onOpenChange,
  variables,
  onVariablesChange,
}: VariablesDialogProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedVars, setParsedVars] = useState<Record<string, any> | null>(
    null,
  );

  // 다이얼로그가 열릴 때 variables를 JSON 텍스트로 변환
  useEffect(() => {
    if (open) {
      try {
        const formatted = JSON.stringify(variables || {}, null, 2);
        setJsonText(formatted);
        setParsedVars(variables || {});
        setError(null);
      } catch (e) {
        setJsonText("{}");
        setParsedVars({});
      }
    }
  }, [open, variables]);

  const handleJsonChange = (value: string) => {
    setJsonText(value);

    // JSON 유효성 검사만 수행 (부모에게 전달하지 않음)
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("변수는 객체 형식이어야 합니다");
        setParsedVars(null);
        return;
      }
      setError(null);
      setParsedVars(parsed);
    } catch (e) {
      setError("유효하지 않은 JSON 형식입니다");
      setParsedVars(null);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setError(null);
      setParsedVars(parsed);
    } catch (e) {
      setError("포맷할 수 없는 JSON입니다");
    }
  };

  const handleSave = () => {
    if (!error && parsedVars !== null) {
      onVariablesChange(parsedVars);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow Variables</DialogTitle>
          <DialogDescription>
            워크플로우에서 사용할 변수를 JSON 형식으로 정의하세요. Step의 블록
            파라미터에서 {"${vars.변수명}"} 형식으로 참조할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-sm min-h-[300px] resize-none"
              placeholder='{\n  "workspaceId": "123",\n  "userName": "test"\n}'
              spellCheck={false}
            />
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleFormat}
            variant="outline"
            size="sm"
            className="w-full"
          >
            JSON 포맷 정리
          </Button>
        </div>

        <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
          <div className="font-medium">사용 예시:</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="text-gray-600">// 변수 정의 (JSON)</div>
            <code className="block text-blue-600">
              {'{ "userId": "12345", "apiKey": "sk-..." }'}
            </code>
            <div className="mt-2 text-gray-600">
              // 블록에서 사용 (template)
            </div>
            <code className="block">
              url: {'{ template: "https://api.com/${vars.userId}" }'}
            </code>
            <code className="block">
              selector: {'{ template: "#user-${vars.userId}" }'}
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!!error}>
            완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
