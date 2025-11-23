import type { ParsedField } from "~/lib/schema-parser";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { useState, useEffect } from "react";
import jsonata from "jsonata";
import { Button } from "~/components/ui/button";
import { PlayIcon, RefreshCwIcon } from "lucide-react";

interface CodeFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
  currentNodeId: string;
  executionResults?: Record<string, any>;
}

export const CodeFieldBlock = (props: CodeFieldBlockProps) => {
  const { field, formData, updateFormField, currentNodeId, executionResults } =
    props;
  const { name, defaultValue } = field;
  console.log(executionResults);

  const [testInput, setTestInput] = useState(
    JSON.stringify({ example: "data", items: [1, 2, 3] }, null, 2),
  );
  const [testOutput, setTestOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  // executionResults가 변경될 때마다 자동으로 테스트 데이터 로드
  useEffect(() => {
    console.log("🔍 CodeFieldBlock Debug:", {
      executionResults,
      hasExecutionResults: !!executionResults,
    });

    if (executionResults && !isAutoLoaded) {
      // executionResults 전체를 그대로 사용
      console.log("✅ 실제 데이터 로드:", executionResults);
      setTestInput(JSON.stringify(executionResults, null, 2));
      setHasRealData(true);
      setIsAutoLoaded(true);
    }
  }, [isAutoLoaded, executionResults]);

  // 테스트 데이터 새로고침
  const handleRefresh = () => {
    if (executionResults) {
      // executionResults 전체를 다시 로드
      setTestInput(JSON.stringify(executionResults, null, 2));
      setHasRealData(true);
    } else {
      setTestInput(
        JSON.stringify({ example: "data", items: [1, 2, 3] }, null, 2),
      );
      setHasRealData(false);
    }
  };

  const handleTest = () => {
    try {
      const code = formData[name] || "";
      if (!code.trim()) {
        setError("JSONata 코드를 입력하세요");
        setTestOutput("");
        return;
      }

      const expression = jsonata(code);
      const input = JSON.parse(testInput);
      const result = expression.evaluate(input);
      setTestOutput(JSON.stringify(result, null, 2));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTestOutput("");
    }
  };

  return (
    <FieldBlockContentBox key={name} label="JSONata 코드" location="top">
      <div className="space-y-2">
        <Textarea
          id={name}
          value={formData[name] ?? ""}
          onChange={(e) => updateFormField(name, e.target.value || undefined)}
          placeholder={
            defaultValue || "// JSONata 코드를 입력하세요 $이 기본 변수입니다."
          }
          className="font-mono text-sm min-h-24"
          spellCheck={false}
        />

        <details className="border rounded-lg p-2">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
            테스트 & 디버그
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-gray-500">
                  테스트 입력 데이터
                  {hasRealData && (
                    <span className="ml-2 text-green-600 font-semibold">
                      ✓ 실제 실행 결과
                    </span>
                  )}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xxs"
                  onClick={handleRefresh}
                  className="h-5 px-2"
                  title="실행 결과 데이터로 새로고침"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                </Button>
              </div>
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-xs min-h-20 max-h-32"
                spellCheck={false}
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleTest}
              className="w-full"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              실행
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <Label className="text-xs text-red-600 font-medium">에러</Label>
                <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                  {error}
                </pre>
              </div>
            )}

            {testOutput && (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <Label className="text-xs text-green-600 font-medium">
                  결과
                </Label>
                <pre className="font-mono text-xs text-green-800 mt-1 max-h-40 overflow-auto">
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
        </details>
      </div>
    </FieldBlockContentBox>
  );
};
