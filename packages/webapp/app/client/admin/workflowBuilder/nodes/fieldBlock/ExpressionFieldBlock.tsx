import type { ParsedField } from "~/lib/schema-parser";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { useState, useEffect } from "react";
import jsonata from "jsonata";
import { Button } from "~/components/ui/button";
import {
  PlayIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  SparklesIcon,
} from "lucide-react";
import { EightGClient } from "scordi-extension";
import { buildJSONataQuery } from "~/client/admin/workflowBuilder/agent/JSONata-qaury-builder";

interface ExpressionFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
  currentNodeId: string;
  executionResults?: Record<string, any>;
}

export const ExpressionFieldBlock = (props: ExpressionFieldBlockProps) => {
  const { field, formData, updateFormField, currentNodeId, executionResults } =
    props;
  const { name, defaultValue } = field;

  // sourceData 필드 값 가져오기 (이전 스텝 데이터 참조)
  const sourceDataValue = formData.sourceData || "";

  const [testInput, setTestInput] = useState(
    JSON.stringify(
      {
        items: [
          { name: "Product A", price: 100 },
          { name: "Product B", price: 200 },
        ],
      },
      null,
      2,
    ),
  );
  const [testOutput, setTestOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [hasRealData, setHasRealData] = useState(false);

  // Auto generation states
  const [targetSchema, setTargetSchema] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);

  // executionResults가 변경될 때마다 자동으로 테스트 데이터 로드
  useEffect(() => {
    if (executionResults) {
      // sourceData 값이 있으면 해당 경로의 데이터를 로드
      let dataToLoad = executionResults.result.context.steps;

      // sourceData가 ${steps.xxx.result.data} 형식인 경우 파싱
      if (sourceDataValue) {
        const match = sourceDataValue.match(
          /\$\{steps\.([^.}]+)\.result\.data\}/,
        );

        if (match && match[1]) {
          const stepId = match[1];

          try {
            // 1. context.steps 구조 시도 (EightGClient 헬퍼 사용)
            if (executionResults.context) {
              const stepData = EightGClient.getStepData(
                executionResults.context,
                stepId,
              );
              if (stepData !== undefined) {
                dataToLoad = stepData;
              } else {
                const stepResult = EightGClient.getStepResult(
                  executionResults.context,
                  stepId,
                );
                if (stepResult !== undefined) {
                  dataToLoad = stepResult;
                }
              }
            }
            // 2. result.steps 배열 구조 시도
            else if (executionResults.result?.steps) {
              const stepResult = executionResults.result.steps.find(
                (s: any) => s.stepId === stepId,
              );
              if (stepResult?.result?.data) {
                dataToLoad = stepResult.result.data;
              }
            }
          } catch (err) {
            console.error("Error loading step data:", err);
          }
        }
      }

      setTestInput(JSON.stringify(dataToLoad, null, 2));
      setHasRealData(true);
    }
  }, [executionResults, sourceDataValue]);

  // 테스트 데이터 새로고침
  const handleRefresh = () => {
    if (executionResults) {
      // sourceData 값에 따라 적절한 데이터 로드
      let dataToLoad = executionResults;

      if (sourceDataValue) {
        const match = sourceDataValue.match(
          /\$\{steps\.([^.}]+)\.result\.data\}/,
        );
        if (match && match[1]) {
          const stepId = match[1];

          try {
            // 1. context.steps 구조 시도 (EightGClient 헬퍼 사용)
            if (executionResults.context) {
              const stepData = EightGClient.getStepData(
                executionResults.context,
                stepId,
              );
              if (stepData !== undefined) {
                dataToLoad = stepData;
              } else {
                const stepResult = EightGClient.getStepResult(
                  executionResults.context,
                  stepId,
                );
                if (stepResult !== undefined) {
                  dataToLoad = stepResult;
                }
              }
            }
            // 2. result.steps 배열 구조 시도
            else if (executionResults.result?.steps) {
              const stepResult = executionResults.result.steps.find(
                (s: any) => s.stepId === stepId,
              );
              if (stepResult?.result?.data) {
                dataToLoad = stepResult.result.data;
              }
            }
          } catch (err) {
            console.error("Error refreshing step data:", err);
          }
        }
      }

      setTestInput(JSON.stringify(dataToLoad, null, 2));
      setHasRealData(true);
    } else {
      setTestInput(
        JSON.stringify(
          {
            items: [
              { name: "Product A", price: 100 },
              { name: "Product B", price: 200 },
            ],
          },
          null,
          2,
        ),
      );
      setHasRealData(false);
    }
  };

  const handleTest = async () => {
    try {
      const expression = formData[name] || "";

      if (!expression.trim()) {
        setError("JSONata 표현식을 입력하세요");
        setTestOutput("");
        return;
      }

      // 변수 참조 문법 체크 (${...})
      if (expression.includes("${")) {
        setError(
          "❌ expression 필드에는 JSONata 표현식만 입력해주세요.\n\n이전 스텝 데이터는 'sourceData' 필드에서 선택하고,\nexpression 필드에는 변환 로직을 작성하세요.\n\n예: $sum(items.price)",
        );
        setTestOutput("");
        return;
      }

      const compiledExpression = jsonata(expression);
      const input = JSON.parse(testInput);
      const result = await compiledExpression.evaluate(input);

      // 결과를 안전하게 문자열로 변환
      const outputStr =
        typeof result === "undefined"
          ? "undefined"
          : JSON.stringify(result, null, 2);

      setTestOutput(outputStr);
      setError("");
    } catch (err) {
      if (err instanceof Error) {
        // JSONata 에러는 더 자세한 정보를 제공
        const errorMessage = err.message;
        const errorDetails: string[] = [errorMessage];

        // @ts-ignore - JSONata error 객체에 추가 정보가 있을 수 있음
        if (err.position !== undefined) {
          // @ts-ignore
          errorDetails.push(`위치: ${err.position}`);
        }
        // @ts-ignore
        if (err.token !== undefined) {
          // @ts-ignore
          errorDetails.push(`토큰: "${err.token}"`);
        }

        setError(errorDetails.join("\n"));
      } else {
        setError(String(err));
      }
      setTestOutput("");
    }
  };

  // Auto generate JSONata expression
  const handleAutoGenerate = async () => {
    try {
      setIsGenerating(true);
      setError("");

      if (!targetSchema.trim()) {
        setError("원하는 결과 형태를 설명해주세요");
        return;
      }

      const sourceData = JSON.parse(testInput);
      const generatedExpression = await buildJSONataQuery(
        sourceData,
        targetSchema,
      );

      // Update the expression field
      updateFormField(name, generatedExpression);

      // Test the generated expression
      await handleTest();

      // Close the auto generate section
      setShowAutoGenerate(false);
      setTargetSchema("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "자동 생성 중 오류 발생");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <FieldBlockContentBox
      key={name}
      label="변환 표현식 (JSONata)"
      location="top"
    >
      <div className="space-y-2">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
          <strong>💡 사용 방법:</strong>
          <br />• <strong>sourceData 필드</strong>: 변환할 데이터의 출처 선택
          (이전 스텝)
          <br />• <strong>expression 필드</strong>: JSONata 표현식 작성 (변수
          참조 문법 ❌)
          <br />
          예: <code className="bg-white px-1 rounded">
            $sum(items.price)
          </code>{" "}
          또는{" "}
          <code className="bg-white px-1 rounded">items[price &gt; 100]</code>
        </div>

        <div className="relative">
          <Textarea
            id={name}
            value={formData[name] ?? ""}
            onChange={(e) => updateFormField(name, e.target.value || undefined)}
            placeholder={defaultValue || "$sum(items.price)"}
            className="font-mono text-sm min-h-24"
            spellCheck={false}
          />
          <Button
            type="button"
            variant="outline"
            size="xxs"
            onClick={() => setShowAutoGenerate(!showAutoGenerate)}
            className="absolute top-2 right-2 gap-1"
            title="AI로 JSONata 표현식 자동 생성"
          >
            <SparklesIcon className="w-3 h-3" />
            AI 자동 생성
          </Button>
        </div>

        {/* Auto Generate Section */}
        {showAutoGenerate && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-purple-700 mb-1 block">
                원하는 결과 형태를 설명해주세요
              </Label>
              <Textarea
                value={targetSchema}
                onChange={(e) => setTargetSchema(e.target.value)}
                placeholder="예: 모든 상품의 가격 합계를 구하고 싶습니다"
                className="font-mono text-xs min-h-20"
                disabled={isGenerating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAutoGenerate}
                disabled={isGenerating || !targetSchema.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    표현식 생성
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAutoGenerate(false);
                  setTargetSchema("");
                }}
                disabled={isGenerating}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* JSONata 참고 링크 */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircleIcon className="w-3 h-3" />
          <span>
            JSONata 문법:{" "}
            <a
              href="https://jsonata.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              jsonata.org
            </a>
          </span>
        </div>

        <details className="border rounded-lg p-3 bg-gray-50" open>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
            <PlayIcon className="w-4 h-4" />
            실시간 테스트 & 디버그
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-gray-700">
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
                  className="h-6 px-2"
                  title="실행 결과 데이터로 새로고침"
                >
                  <RefreshCwIcon className="w-3 h-3 mr-1" />
                  새로고침
                </Button>
              </div>
              {sourceDataValue && (
                <div className="mb-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                  <span className="font-medium">소스 데이터 경로:</span>{" "}
                  {sourceDataValue}
                </div>
              )}
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder='{"items": [{"name": "Product A", "price": 100}]}'
                className="font-mono text-xs min-h-32 max-h-48 bg-white"
                spellCheck={false}
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleTest}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              표현식 실행
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <Label className="text-xs text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircleIcon className="w-4 h-4" />
                  에러
                </Label>
                <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap font-mono">
                  {error}
                </pre>
              </div>
            )}

            {testOutput && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <Label className="text-xs text-green-700 font-semibold">
                  ✓ 결과
                </Label>
                <pre className="font-mono text-xs text-green-800 mt-2 max-h-48 overflow-auto bg-white rounded p-2 border border-green-300">
                  {testOutput}
                </pre>
              </div>
            )}

            {/* 사용 예시 */}
            {!testOutput && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <Label className="text-xs text-blue-700 font-semibold mb-2 block">
                  💡 사용 예시
                </Label>
                <div className="text-xs text-blue-800 space-y-1 font-mono">
                  <div>
                    • <code>$sum(items.price)</code> - 가격 합계
                  </div>
                  <div>
                    • <code>items[price &gt; 100]</code> - 필터링
                  </div>
                  <div>
                    • <code>{"items.{name: name, total: price * 2}"}</code> -
                    변환
                  </div>
                  <div>
                    • <code>$count(items)</code> - 개수 세기
                  </div>
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
    </FieldBlockContentBox>
  );
};
