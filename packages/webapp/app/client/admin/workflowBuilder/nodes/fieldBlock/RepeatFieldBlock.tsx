import { useState, useEffect, useRef, useCallback } from "react";
import { useReactFlow, type Edge } from "@xyflow/react";
import type { RepeatConfig, RepeatScope } from "scordi-extension";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { usePreviousNodes } from "../../../../../hooks/use-previous-nodes";
import { useNextNodes } from "~/hooks/use-next-nodes";
import { collectSubtreeNodes } from "../../utils/subtreePreview";
import { useSubtreePreview } from "../../context/SubtreePreviewContext";

interface RepeatFieldBlockProps {
  repeat?: RepeatConfig;
  onRepeatChange: (repeat: RepeatConfig | undefined) => void;
  currentNodeId?: string;
}

type RepeatType = "none" | "forEach" | "count";

export function RepeatFieldBlock({
  repeat,
  onRepeatChange,
  currentNodeId,
}: RepeatFieldBlockProps) {
  const reactFlowInstance = useReactFlow();
  const { setPreview, clearPreview } = useSubtreePreview();
  const { previousNodes, getNodeDisplayName, createPathReference } =
    usePreviousNodes(currentNodeId || "");
  const { nextNodes } = useNextNodes(currentNodeId || "");

  const [repeatType, setRepeatType] = useState<RepeatType>(() => {
    if (!repeat) return "none";
    if ("forEach" in repeat) return "forEach";
    if ("count" in repeat) return "count";
    return "none";
  });

  const [forEachPath, setForEachPath] = useState<string>(
    repeat && "forEach" in repeat ? repeat.forEach : "",
  );
  const [countValue, setCountValue] = useState<string>(
    repeat && "count" in repeat ? String(repeat.count) : "10",
  );
  const [continueOnError, setContinueOnError] = useState<boolean>(
    repeat?.continueOnError ?? false,
  );
  const [delayBetween, setDelayBetween] = useState<string>(
    repeat?.delayBetween ? String(repeat.delayBetween) : "",
  );
  const [scope, setScope] = useState<RepeatScope>(repeat?.scope ?? "block");
  const [subtreeEnd, setSubtreeEnd] = useState<string>(
    repeat?.subtreeEnd ?? "",
  );
  const previewOwnerRef = useRef<string | null>(null);
  const previewRolesRef = useRef<string | null>(null);

  // 드롭다운 관련 상태
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Input 값 변경 처리 (forEach 경로)
  const handleForEachPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setForEachPath(newValue);
    setCursorPosition(cursorPos);

    // $. 감지
    if (
      newValue.slice(0, cursorPos).endsWith("$.") &&
      previousNodes.length > 0
    ) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // 노드 선택 처리 (순수 경로 사용 - forEach는 템플릿 없이)
  const handleNodeSelect = (nodeId: string) => {
    const nodeRef = createPathReference(nodeId);
    const beforeCursor = forEachPath.slice(0, cursorPosition - 2); // $. 제거
    const afterCursor = forEachPath.slice(cursorPosition);
    const newValue = beforeCursor + nodeRef + afterCursor;

    setForEachPath(newValue);
    setShowDropdown(false);

    // 커서 위치를 삽입된 참조 뒤로 이동
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeCursor.length + nodeRef.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const lastEmittedRef = useRef<string | null>(null);

  const clearSubtreePreview = useCallback(() => {
    const owner = previewOwnerRef.current;
    if (!owner) return;
    clearPreview(owner);
    previewOwnerRef.current = null;
    previewRolesRef.current = null;
  }, [clearPreview]);

  useEffect(() => {
    if (repeatType === "none") {
      if (lastEmittedRef.current !== "null") {
        lastEmittedRef.current = "null";
        onRepeatChange(undefined);
      }
      return;
    }

    if (scope === "subtree") {
      if (!subtreeEnd.trim()) {
        if (lastEmittedRef.current !== "null") {
          lastEmittedRef.current = "null";
          onRepeatChange(undefined);
        }
        return;
      }
      if (subtreeEnd && !nextNodes.find((node) => node.id === subtreeEnd)) {
        if (lastEmittedRef.current !== "null") {
          lastEmittedRef.current = "null";
          onRepeatChange(undefined);
        }
        return;
      }
    }

    const repeatCommon: Partial<RepeatConfig> = {
      ...(continueOnError && { continueOnError }),
      ...(delayBetween && { delayBetween: parseInt(delayBetween) }),
      ...(scope === "subtree" && { scope, subtreeEnd: subtreeEnd.trim() }),
    };

    if (repeatType === "forEach") {
      if (!forEachPath.trim()) {
        onRepeatChange(undefined);
        return;
      }
      const config: RepeatConfig = {
        forEach: forEachPath.trim(),
        ...repeatCommon,
      };
      const serialized = JSON.stringify(config);
      if (serialized === lastEmittedRef.current) return;
      lastEmittedRef.current = serialized;
      onRepeatChange(config);
      return;
    }

    if (repeatType === "count") {
      const parsedCount = countValue.startsWith("$")
        ? countValue
        : parseInt(countValue) || 1;

      const config: RepeatConfig = {
        count: parsedCount,
        ...repeatCommon,
      };
      const serialized = JSON.stringify(config);
      if (serialized === lastEmittedRef.current) return;
      lastEmittedRef.current = serialized;
      onRepeatChange(config);
      return;
    }
  }, [
    repeatType,
    forEachPath,
    countValue,
    continueOnError,
    delayBetween,
    scope,
    subtreeEnd,
    nextNodes,
    onRepeatChange,
  ]);

  useEffect(() => {
    if (scope !== "subtree") {
      clearSubtreePreview();
      return;
    }
    if (!subtreeEnd && nextNodes.length > 0) {
      setSubtreeEnd(nextNodes[0].id);
    } else if (
      subtreeEnd &&
      nextNodes.length > 0 &&
      !nextNodes.find((node) => node.id === subtreeEnd)
    ) {
      setSubtreeEnd(nextNodes[0].id);
    }
  }, [scope, nextNodes, subtreeEnd, clearSubtreePreview]);

  useEffect(() => {
    if (!currentNodeId) return;
    if (scope !== "subtree" || !subtreeEnd.trim()) {
      clearSubtreePreview();
      return;
    }
    const nodesSnapshot = reactFlowInstance.getNodes();
    const edgesSnapshot = reactFlowInstance.getEdges() as Edge[];
    const previewInfo = collectSubtreeNodes(
      nodesSnapshot,
      edgesSnapshot,
      currentNodeId,
      subtreeEnd,
    );
    const previewOwner = currentNodeId;
    if (!previewOwner) return;
    const previewId = `${currentNodeId}-${subtreeEnd}`;
    const rolesSignature = JSON.stringify(
      Object.entries(previewInfo.roles).sort(([a], [b]) =>
        a.localeCompare(b),
      ),
    );

    if (
      previewOwnerRef.current === previewOwner &&
      previewRolesRef.current === rolesSignature
    ) {
      return;
    }

    previewOwnerRef.current = previewOwner;
    previewRolesRef.current = rolesSignature;
    setPreview({
      startId: previewOwner!,
      subtreeEnd,
      roles: previewInfo.roles,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, subtreeEnd, currentNodeId]);

  useEffect(() => {
    return () => {
      clearSubtreePreview();
    };
  }, [clearSubtreePreview]);

  const scopeControlsVisible = repeatType !== "none";
  const subtreeUnavailable = scope === "subtree" && nextNodes.length === 0;

  return (
    <Accordion type="single" collapsible className="border rounded-md">
      <AccordionItem value="repeat" className="border-none">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold cursor-pointer">
              반복 실행
            </Label>
            {repeatType !== "none" && (
              <span className="text-xs text-gray-500">
                ({repeatType === "forEach" ? "배열 반복" : "횟수 반복"})
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {/* 탭 버튼 */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={repeatType === "none" ? "default" : "outline"}
              size="sm"
              onClick={() => setRepeatType("none")}
            >
              없음
            </Button>
            <Button
              type="button"
              variant={repeatType === "forEach" ? "default" : "outline"}
              size="sm"
              onClick={() => setRepeatType("forEach")}
            >
              배열 반복
            </Button>
            <Button
              type="button"
              variant={repeatType === "count" ? "default" : "outline"}
              size="sm"
              onClick={() => setRepeatType("count")}
            >
              횟수 반복
            </Button>
          </div>

          {/* forEach 설정 */}
          {repeatType === "forEach" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1">배열 경로</Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder="$.steps.stepId.result.data"
                    value={forEachPath}
                    onChange={handleForEachPathChange}
                    className="text-sm"
                  />
                  {showDropdown && previousNodes.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                      <div className="p-2 text-xs text-gray-500 border-b">
                        이전 노드 선택
                      </div>
                      {previousNodes.map((node) => (
                        <div
                          key={node.id}
                          onClick={() => handleNodeSelect(node.id)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {getNodeDisplayName(node)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xxs text-gray-500 mt-1">
                  예: $.steps.getProducts.result.data ($.로 이전 노드 참조)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="forEach-continueOnError"
                  checked={continueOnError}
                  onCheckedChange={(checked) => setContinueOnError(!!checked)}
                />
                <Label
                  htmlFor="forEach-continueOnError"
                  className="text-xs font-normal cursor-pointer"
                >
                  에러 발생 시 계속 실행 (continueOnError)
                </Label>
              </div>

              <div>
                <Label className="text-xs mb-1">반복 간격 (ms)</Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={delayBetween}
                  onChange={(e) => setDelayBetween(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xxs text-gray-500 mt-1">
                  각 반복 사이 대기 시간 (선택사항)
                </p>
              </div>
            </div>
          )}

          {/* count 설정 */}
          {repeatType === "count" && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1">반복 횟수</Label>
                <Input
                  placeholder="10 또는 $.vars.pageCount"
                  value={countValue}
                  onChange={(e) => setCountValue(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xxs text-gray-500 mt-1">
                  숫자 또는 변수 경로 (예: $.vars.count)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="count-continueOnError"
                  checked={continueOnError}
                  onCheckedChange={(checked) => setContinueOnError(!!checked)}
                />
                <Label
                  htmlFor="count-continueOnError"
                  className="text-xs font-normal cursor-pointer"
                >
                  에러 발생 시 계속 실행 (continueOnError)
                </Label>
              </div>

              <div>
                <Label className="text-xs mb-1">반복 간격 (ms)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={delayBetween}
                  onChange={(e) => setDelayBetween(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xxs text-gray-500 mt-1">
                  각 반복 사이 대기 시간 (선택사항)
                </p>
              </div>
            </div>
          )}

          {scopeControlsVisible && (
            <div className="mt-5 space-y-3 border-t pt-4">
              <Label className="text-xs font-semibold">반복 범위</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={scope === "block" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope("block")}
                >
                  블록만 (기본)
                </Button>
                <Button
                  type="button"
                  variant={scope === "subtree" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScope("subtree")}
                  disabled={nextNodes.length === 0}
                >
                  서브트리 전체
                </Button>
              </div>
              <p className="text-xxs text-gray-500">
                반복 범위를 블록 단위(기본) 또는 서브트리 단위로 지정할 수 있어요.
              </p>
              {scope === "subtree" && (
                <div className="space-y-2">
                  <Label className="text-xs mb-1">반복 종료 스텝</Label>
                  {nextNodes.length > 0 ? (
                    <Select value={subtreeEnd} onValueChange={setSubtreeEnd}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="반복을 끝낼 스텝을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {nextNodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {getNodeDisplayName(node)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      현재 노드 이후에 연결된 스텝이 없어 서브트리 반복을 구성할 수
                      없습니다.
                    </div>
                  )}
                  <p className="text-xxs text-gray-500">
                    선택한 스텝 직전까지를 하나의 반복 단위로 실행한 뒤, 해당 스텝에서
                    워크플로우가 이어집니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {repeatType === "none" && (
            <p className="text-xs text-gray-500">
              이 블록은 한 번만 실행됩니다.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
