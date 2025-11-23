import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ResultParser } from "~/models/workflow/ResultParser";
import { useState } from "react";

interface ParserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expression: string;
  onExpressionChange: (expr: string) => void;
  sampleResult?: any;
}

export function ParserDialog({
  open,
  onOpenChange,
  expression,
  onExpressionChange,
  sampleResult,
}: ParserDialogProps) {
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);

  const handlePreview = async () => {
    if (!sampleResult) {
      setPreviewError("워크플로우를 먼저 실행해주세요");
      setHasResult(false);
      return;
    }

    console.log("🔍 Sample Result:", sampleResult);
    console.log("🔍 Expression:", expression);

    try {
      const result = await ResultParser.parse(sampleResult, expression);
      console.log("✅ Parsed Result:", result);
      setPreviewResult(result);
      setPreviewError(null);
      setHasResult(true);
    } catch (error: any) {
      console.error("❌ Parse Error:", error);
      setPreviewError(error.message);
      setPreviewResult(null);
      setHasResult(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>결과 파싱 설정 (JSONata)</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* 왼쪽: 표현식 입력 */}
          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-sm font-medium">JSONata 표현식:</label>

            <Textarea
              placeholder={`예시:
result.result.steps[0].result.data[attributes.id != null].{
  "elementId": attributes.id,
  "elementText": text
}`}
              value={expression}
              onChange={(e) => onExpressionChange(e.target.value)}
              className="font-mono text-sm flex-1 resize-none min-h-0"
            />

            <Button onClick={handlePreview} size="sm">
              미리보기
            </Button>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="flex flex-col gap-2 min-h-0">
            <label className="text-sm font-medium">파싱 결과:</label>
            <div className="flex-1 border rounded p-3 overflow-auto bg-gray-50 min-h-0">
              {previewError ? (
                <div className="text-red-500 text-sm">{previewError}</div>
              ) : hasResult ? (
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(previewResult, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-400 text-sm">
                  미리보기를 클릭하세요
                </div>
              )}
            </div>

            {/* 원본 데이터 보기 */}
            {sampleResult && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">
                  원본 데이터 보기
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {JSON.stringify(sampleResult, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={() => onOpenChange(false)}>완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
