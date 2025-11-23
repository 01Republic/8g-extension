import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { SwitchEdgeData } from "~/models/workflow/types";
import { EdgFieldContentBox } from "./EdgFieldContentBox";
import type {
  ConditionMode,
  MultipleConditionType,
  SingleConditionType,
} from "./types";
import { SingleEquals } from "./SingleEquals";
import { SingleExists } from "./SingleExists";
import { SingleContains } from "./SingleContains";
import { Multiple } from "./Multiple";
import { SingleRegex } from "./SingleRegex";
import { useEdgeFormState } from "./useEdgeFormState";

interface EdgeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edgeData?: SwitchEdgeData;
  onSave: (data: SwitchEdgeData) => void;
  targetNodeId: string;
}

export function EdgeConfigDialog({
  open,
  onOpenChange,
  edgeData,
  onSave,
  targetNodeId,
}: EdgeConfigDialogProps) {
  // Custom Hook으로 상태 관리
  const {
    conditionMode,
    singleConditionType,
    multipleConditionType,
    setConditionMode,
    setSingleConditionType,
    setMultipleConditionType,
    equalsData,
    existsData,
    containsData,
    regexData,
    exprData,
    setEqualsData,
    setExistsData,
    setContainsData,
    setRegexData,
    setExprData,
    subConditions,
    setSubConditions,
    buildData,
  } = useEdgeFormState({ open, edgeData });

  const handleSave = () => {
    const newData = buildData();
    onSave(newData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] ">
        <DialogHeader>
          <DialogTitle>Edge 조건 설정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col w-full gap-4 py-4 ">
          {/* 조건 모드 선택 */}
          <EdgFieldContentBox label="조건 모드">
            <Select
              value={conditionMode}
              onValueChange={(v) => setConditionMode(v as ConditionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">단일 조건</SelectItem>
                <SelectItem value="multiple">복합 조건 (AND/OR)</SelectItem>
              </SelectContent>
            </Select>
          </EdgFieldContentBox>

          {/* 단일 조건 */}
          {conditionMode === "single" && (
            <EdgFieldContentBox label="조건 타입">
              <Select
                value={singleConditionType}
                onValueChange={(v) =>
                  setSingleConditionType(v as SingleConditionType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">조건 없음 (기본)</SelectItem>
                  <SelectItem value="equals">같음 (equals)</SelectItem>
                  <SelectItem value="contains">포함 (contains)</SelectItem>
                  <SelectItem value="exists">존재 여부 (exists)</SelectItem>
                  <SelectItem value="regex">정규식 (regex)</SelectItem>
                  <SelectItem value="expr">표현식 (expr)</SelectItem>
                </SelectContent>
              </Select>
            </EdgFieldContentBox>
          )}

          {/* 복합 조건 (AND/OR) */}
          {conditionMode === "multiple" && (
            <EdgFieldContentBox label="복합 조건 타입">
              <Select
                value={multipleConditionType}
                onValueChange={(v) =>
                  setMultipleConditionType(v as MultipleConditionType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">AND (모두 만족)</SelectItem>
                  <SelectItem value="or">OR (하나라도 만족)</SelectItem>
                </SelectContent>
              </Select>
            </EdgFieldContentBox>
          )}

          {/* 단일 조건 상세 설정 */}
          {conditionMode === "single" && singleConditionType === "equals" && (
            <SingleEquals
              targetNodeId={targetNodeId}
              data={equalsData}
              onChange={setEqualsData}
            />
          )}

          {conditionMode === "single" && singleConditionType === "exists" && (
            <SingleExists
              targetNodeId={targetNodeId}
              data={existsData}
              onChange={setExistsData}
            />
          )}

          {conditionMode === "single" && singleConditionType === "contains" && (
            <SingleContains
              targetNodeId={targetNodeId}
              data={containsData}
              onChange={setContainsData}
            />
          )}

          {conditionMode === "single" && singleConditionType === "expr" && (
            <EdgFieldContentBox label="표현식">
              <Input
                placeholder="$.steps.prev.result.data == 'OK'"
                value={exprData.expr}
                onChange={(e) => setExprData({ expr: e.target.value })}
              />
            </EdgFieldContentBox>
          )}

          {conditionMode === "multiple" && (
            <Multiple
              targetNodeId={targetNodeId}
              multipleConditionType={multipleConditionType}
              subConditions={subConditions}
              onChange={setSubConditions}
            />
          )}

          {conditionMode === "single" && singleConditionType === "regex" && (
            <SingleRegex
              targetNodeId={targetNodeId}
              data={regexData}
              onChange={setRegexData}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
