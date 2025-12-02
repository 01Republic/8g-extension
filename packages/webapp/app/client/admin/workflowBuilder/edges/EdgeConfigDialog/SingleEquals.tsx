import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EdgFieldContentBox } from "./EdgFieldContentBox";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { usePreviousNodes } from "~/hooks/use-previous-nodes";
import type { EqualsData } from "./edgeDataConverter";
import type { Dispatch, SetStateAction } from "react";
import type { ValueType } from "./types";

interface SingleEqualsProps {
  targetNodeId: string;
  data: EqualsData;
  onChange: Dispatch<SetStateAction<EqualsData>>;
}

export const SingleEquals = ({
  targetNodeId,
  data,
  onChange,
}: SingleEqualsProps) => {
  const { previousNodes, getNodeDisplayName } = usePreviousNodes(targetNodeId);

  const updateField = <K extends keyof EqualsData>(
    field: K,
    value: EqualsData[K],
  ) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  // 타입 변경 시 값 변환
  const handleTypeChange = (newType: ValueType) => {
    const currentValue = data.value;
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
        convertedValue = String(currentValue);
    }

    onChange((prev) => ({
      ...prev,
      valueType: newType,
      value: convertedValue,
    }));
  };

  return (
    <>
      <EdgFieldContentBox label="비교할 노드">
        <Select
          value={data.nodeId}
          onValueChange={(v) => updateField("nodeId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="노드 선택" />
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

      <EdgFieldContentBox
        label="결과 경로"
        helperText={`최종 경로: $.steps.${data.nodeId}.${data.path}`}
      >
        <Input
          placeholder="result.data"
          value={data.path}
          onChange={(e) => updateField("path", e.target.value)}
        />
      </EdgFieldContentBox>

      <EdgFieldContentBox label="비교 값">
        <div className="flex gap-2 items-center">
          <Select
            value={data.valueType}
            onValueChange={(v) => handleTypeChange(v as ValueType)}
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

          {data.valueType === "boolean" ? (
            <div className="flex-1 flex items-center gap-2">
              <Checkbox
                checked={data.value === true}
                onCheckedChange={(checked) =>
                  updateField("value", checked === true)
                }
              />
              <span className="text-sm text-gray-600">
                {data.value === true ? "true" : "false"}
              </span>
            </div>
          ) : (
            <Input
              className="flex-1"
              placeholder={data.valueType === "number" ? "0" : "OK"}
              type={data.valueType === "number" ? "number" : "text"}
              value={String(data.value)}
              onChange={(e) =>
                updateField(
                  "value",
                  data.valueType === "number"
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          )}
        </div>
      </EdgFieldContentBox>
    </>
  );
};
