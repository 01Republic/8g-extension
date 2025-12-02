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
  ValueType,
} from "./types";
import { Checkbox } from "~/components/ui/checkbox";
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
        valueType: "string",
      },
    ]);
  };

  // equals 타입일 때 값 타입 변경 핸들러
  const handleValueTypeChange = (id: string, newType: ValueType) => {
    onChange(
      subConditions.map((c) => {
        if (c.id !== id) return c;

        const currentValue = c.value;
        let convertedValue: string | number | boolean;

        switch (newType) {
          case "boolean":
            if (typeof currentValue === "boolean") {
              convertedValue = currentValue;
            } else if (typeof currentValue === "string") {
              convertedValue =
                currentValue.toLowerCase() === "true" || currentValue === "1";
            } else {
              convertedValue = Boolean(currentValue);
            }
            break;
          case "number":
            if (typeof currentValue === "number") {
              convertedValue = currentValue;
            } else {
              const num = Number(currentValue);
              convertedValue = isNaN(num) ? 0 : num;
            }
            break;
          default:
            convertedValue = String(currentValue ?? "");
        }

        return { ...c, valueType: newType, value: convertedValue };
      }),
    );
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

              {/* equals 타입: 값 타입 선택 + 값 입력 */}
              {sub.type === "equals" && (
                <EdgFieldContentBox label="비교 값">
                  <div className="flex gap-2 items-center">
                    <Select
                      value={sub.valueType || "string"}
                      onValueChange={(v) =>
                        handleValueTypeChange(sub.id, v as ValueType)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">문자열</SelectItem>
                        <SelectItem value="number">숫자</SelectItem>
                        <SelectItem value="boolean">논리값</SelectItem>
                      </SelectContent>
                    </Select>

                    {sub.valueType === "boolean" ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Checkbox
                          checked={sub.value === true}
                          onCheckedChange={(checked) =>
                            updateSubCondition(sub.id, "value", checked === true)
                          }
                        />
                        <span className="text-sm text-gray-600">
                          {sub.value === true ? "true" : "false"}
                        </span>
                      </div>
                    ) : (
                      <Input
                        className="flex-1"
                        value={String(sub.value ?? "")}
                        onChange={(e) =>
                          updateSubCondition(
                            sub.id,
                            "value",
                            sub.valueType === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        type={sub.valueType === "number" ? "number" : "text"}
                        placeholder={sub.valueType === "number" ? "0" : "OK"}
                      />
                    )}
                  </div>
                </EdgFieldContentBox>
              )}

              {/* contains/regex 타입: 문자열만 */}
              {(sub.type === "contains" || sub.type === "regex") && (
                <EdgFieldContentBox
                  label={
                    sub.type === "contains" ? "검색 문자열" : "정규식 패턴"
                  }
                >
                  <Input
                    value={String(sub.value ?? "")}
                    onChange={(e) =>
                      updateSubCondition(sub.id, "value", e.target.value)
                    }
                    placeholder={
                      sub.type === "contains" ? "검색할 문자열" : "^OK$"
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
