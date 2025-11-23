import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type {
  MultipleConditionType,
  SubCondition,
  SubConditionType,
} from "./types";
import { EdgFieldContentBox } from "./EdgFieldContentBox";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { usePreviousNodes } from "~/hooks/use-previous-nodes";

import type { Dispatch, SetStateAction } from "react";

interface MultipleProps {
  targetNodeId: string;
  multipleConditionType: MultipleConditionType;
  subConditions: SubCondition[];
  onChange: Dispatch<SetStateAction<SubCondition[]>>;
}

export const Multiple = (props: MultipleProps) => {
  const { targetNodeId, multipleConditionType, subConditions, onChange } =
    props;

  const { previousNodes, getNodeDisplayName } = usePreviousNodes(targetNodeId);

  const addSubCondition = () => {
    onChange([
      ...subConditions,
      {
        id: `sub-${Date.now()}`,
        type: "equals",
        nodeId: previousNodes[0]?.id || "",
        path: "result.data",
        value: "",
      },
    ]);
  };

  const updateSubCondition = (
    id: string,
    field: keyof SubCondition,
    value: any,
  ) => {
    onChange(
      subConditions.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeSubCondition = (id: string) => {
    onChange(subConditions.filter((c) => c.id !== id));
  };

  return (
    <div className="grid gap-2">
      <div>
        <div className="flex items-center justify-between pt-4">
          <span>
            {multipleConditionType === "and"
              ? "AND 조건 (모두 만족)"
              : "OR 조건 (하나라도 만족)"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSubCondition}
          >
            + 조건 추가
          </Button>
        </div>
        {subConditions.length === 0 && (
          <p className="text-xs text-red-500">조건을 추가해주세요</p>
        )}
      </div>

      {subConditions.length >= 1 && (
        <section className="overflow-y-auto max-h-[45vh] overflow-hidden grid  border rounded-md divide-y">
          {subConditions.map((sub, index) => (
            <div key={sub.id} className="flex flex-col gap-y-4 py-4 px-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">조건 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubCondition(sub.id)}
                >
                  삭제
                </Button>
              </div>

              <EdgFieldContentBox label="조건 타입">
                <Select
                  value={sub.type}
                  onValueChange={(v) =>
                    updateSubCondition(sub.id, "type", v as SubConditionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">같음 (equals)</SelectItem>
                    <SelectItem value="contains">포함 (contains)</SelectItem>
                    <SelectItem value="exists">존재 (exists)</SelectItem>
                    <SelectItem value="regex">정규식 (regex)</SelectItem>
                  </SelectContent>
                </Select>
              </EdgFieldContentBox>

              <EdgFieldContentBox label="노드">
                <Select
                  value={sub.nodeId}
                  onValueChange={(v) => updateSubCondition(sub.id, "nodeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {previousNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {getNodeDisplayName(node)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EdgFieldContentBox>

              <EdgFieldContentBox label="경로">
                <Input
                  value={sub.path}
                  onChange={(e) =>
                    updateSubCondition(sub.id, "path", e.target.value)
                  }
                  placeholder="result.data"
                />
              </EdgFieldContentBox>

              {(sub.type === "equals" ||
                sub.type === "contains" ||
                sub.type === "regex") && (
                <EdgFieldContentBox
                  label={
                    sub.type === "equals"
                      ? "비교 값"
                      : sub.type === "contains"
                        ? "검색 문자열"
                        : "정규식 패턴"
                  }
                >
                  <Input
                    value={sub.value || ""}
                    onChange={(e) =>
                      updateSubCondition(sub.id, "value", e.target.value)
                    }
                    placeholder={
                      sub.type === "equals"
                        ? "OK"
                        : sub.type === "contains"
                          ? "검색할 문자열"
                          : "^OK$"
                    }
                  />
                </EdgFieldContentBox>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
