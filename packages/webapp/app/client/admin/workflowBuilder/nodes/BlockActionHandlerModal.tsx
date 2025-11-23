import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Block, RepeatConfig } from "scordi-extension";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { type ParsedSchema } from "~/lib/schema-parser";
import { StringFieldBlock } from "./fieldBlock/StringFieldBlock";
import { NumberFieldBlock } from "./fieldBlock/NumberFieldBlock";
import { BooleanFieldBlock } from "./fieldBlock/BooleanFieldBlock";
import { EnumFieldBlock } from "./fieldBlock/EnumFieldBlock";
import { ArrayFieldBlock } from "./fieldBlock/ArrayFieldBlock";
import { TextFilterFieldBlock } from "./fieldBlock/TextFilterFieldBlock";
import { OptionFieldBlock } from "./fieldBlock/OptionFieldBlock";
import { SchemaDefinitionFieldBlock } from "./fieldBlock/SchemaDefinitionFieldBlock";
import { SourceDataFieldBlock } from "./fieldBlock/SourceDataFieldBlock";
import { RecordFieldBlock } from "./fieldBlock/RecordFieldBlock";
import { CodeFieldBlock } from "./fieldBlock/CodeFieldBlock";
import { ExpressionFieldBlock } from "./fieldBlock/ExpressionFieldBlock";
import { RepeatFieldBlock } from "./fieldBlock/RepeatFieldBlock";
import { ConditionsFieldBlock } from "./fieldBlock/ConditionsFieldBlock";
import { KeyFieldBlock } from "./fieldBlock/KeyFieldBlock";
import { ModifiersFieldBlock } from "./fieldBlock/ModifiersFieldBlock";
import { NotificationFieldBlock } from "./fieldBlock/NotificationFieldBlock";
import { ExtractorsFieldBlock } from "./fieldBlock/ExtractorsFieldBlock";
import { CheckStatusOptionsFieldBlock } from "./fieldBlock/CheckStatusOptionsFieldBlock";

interface BlockActionHandlerModalProps {
  id: string;
  title: string;
  block: Block;
  parsedSchema: ParsedSchema;
  repeat?: RepeatConfig;
  executionResults?: Record<string, any>;
}

export const BlockActionHandlerModal = (
  props: BlockActionHandlerModalProps,
) => {
  const {
    id,
    title,
    parsedSchema,
    block,
    repeat: initialRepeat,
    executionResults,
  } = props;

  const { setNodes } = useReactFlow();
  const blockName = block.name;
  const [open, setOpen] = useState(false);

  // Form state - 동적으로 생성
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    parsedSchema.fields.forEach((field) => {
      if (field.name === "name") {
        initial[field.name] = blockName; // literal value
      } else if (field.name === "option" && field.type === "object") {
        initial[field.name] = (block as any).option || {};
      } else {
        initial[field.name] =
          (block as any)[field.name] ?? field.defaultValue ?? "";
      }
    });
    return initial;
  });

  // Repeat state
  const [repeat, setRepeat] = useState<RepeatConfig | undefined>(initialRepeat);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Reset form data from block
      const newFormData: Record<string, any> = {};
      parsedSchema.fields.forEach((field) => {
        if (field.name === "name") {
          newFormData[field.name] = blockName;
        } else if (field.name === "option" && field.type === "object") {
          newFormData[field.name] = (block as any).option || {};
        } else {
          newFormData[field.name] =
            (block as any)[field.name] ?? field.defaultValue ?? "";
        }
      });
      setFormData(newFormData);
      // Reset repeat from props
      setRepeat(initialRepeat);
    }
  };

  const handleSave = () => {
    const nextBlock: any = {
      name: blockName,
    };

    // Apply form data to block
    parsedSchema.fields.forEach((field) => {
      if (field.name === "name") return; // Skip name, it's literal

      const value = formData[field.name];

      // undefined나 빈 문자열은 저장하지 않음 (필드 삭제)
      if (value === undefined || value === "") {
        return; // Skip
      }

      // option은 특별 처리
      if (field.name === "option" && field.type === "object") {
        nextBlock.option = value;
      } else {
        nextBlock[field.name] = value;
      }
    });

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          data: {
            ...n.data,
            block: nextBlock,
            repeat, // ✅ repeat 데이터 저장
          },
        } as any;
      }),
    );
    setOpen(false);
  };

  const updateFormField = (fieldName: string, value: any) => {
    setFormData((prev) => {
      console.log("updateFormField", fieldName, value);
      if (value === undefined) {
        // undefined이면 필드를 삭제
        const newData = { ...prev };
        delete newData[fieldName];
        return newData;
      }
      return { ...prev, [fieldName]: value };
    });
  };

  const updateOptionField = (optionKey: string, value: any) => {
    setFormData((prev) => {
      if (value === undefined) {
        // undefined이면 option 내 필드를 삭제
        const newOption = { ...prev.option };
        delete newOption[optionKey];
        return {
          ...prev,
          option: Object.keys(newOption).length > 0 ? newOption : undefined,
        };
      }
      return {
        ...prev,
        option: {
          ...prev.option,
          [optionKey]: value,
        },
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xxs">
          수정
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1200px] max-w-7xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title} 편집</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-5">
          {/* ⭐ Repeat 설정 섹션 (상단 배치) */}
          <RepeatFieldBlock
            repeat={repeat}
            onRepeatChange={setRepeat}
            currentNodeId={id}
          />

          {parsedSchema.fields.map((field) => {
            if (field.name === "name") return null;

            if (field.name === "option" && field.type === "object") {
              return (
                <OptionFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateOptionField={updateOptionField}
                />
              );
            }

            // check-status 블록의 options 필드는 특별 처리
            if (field.name === "options" && blockName === "check-status") {
              return (
                <CheckStatusOptionsFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            }

            // Render field based on type

            // schemaDefinition은 독립적으로 처리 (discriminated union이라 field.type이 "object"가 아닐 수 있음)
            if (field.name === "schemaDefinition") {
              return (
                <SchemaDefinitionFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            }

            if (field.type === "string") {
              // sourceData, inputData는 이전 노드 선택 드롭다운으로
              if (field.name === "sourceData" || field.name === "inputData") {
                return (
                  <SourceDataFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                    currentNodeId={id}
                  />
                );
              }
              // code 필드는 코드 입력 textarea로
              if (field.name === "code") {
                return (
                  <CodeFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                    currentNodeId={id}
                    executionResults={executionResults}
                  />
                );
              }
              // expression 필드 (transform-data 블록)는 JSONata 테스트 UI로
              if (
                field.name === "expression" &&
                blockName === "transform-data"
              ) {
                return (
                  <ExpressionFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                    currentNodeId={id}
                    executionResults={executionResults}
                  />
                );
              }
              // key 필드 (keypress 블록)는 키 선택 드롭다운으로
              if (field.name === "key" && blockName === "keypress") {
                return (
                  <KeyFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
              return (
                <StringFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                  currentNodeId={id}
                />
              );
            } else if (field.type === "number") {
              return (
                <NumberFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            } else if (field.type === "boolean") {
              return (
                <BooleanFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            } else if (field.type === "enum") {
              return (
                <EnumFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            } else if (
              field.type === "array" &&
              field.arrayItemType === "string"
            ) {
              // modifiers 필드 (keypress 블록)는 체크박스 형태로
              if (field.name === "modifiers" && blockName === "keypress") {
                return (
                  <ModifiersFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
              return (
                <ArrayFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                />
              );
            } else if (field.type === "array" && field.arrayItemType === "object") {
              // extractors 필드 (get-element-data 블록)는 특수 UI로
              if (field.name === "extractors" && blockName === "get-element-data") {
                return (
                  <ExtractorsFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
            } else if (field.type === "record") {
              return (
                <RecordFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                  currentNodeId={id}
                />
              );
            } else if (field.type === "union") {
              // Handle union types like requestBodyPattern (string | Record<string, any>)
              // Use RecordFieldBlock for requestBodyPattern to handle JSON objects properly
              if (field.name === "requestBodyPattern") {
                // Use RecordFieldBlock to handle as JSON object
                return (
                  <RecordFieldBlock
                    key={field.name}
                    field={{
                      ...field,
                      type: "record" as const, // Override type to use RecordFieldBlock
                      description:
                        "요청 본문 필터 패턴 (JSON 객체). ${vars.변수명} 형태의 변수 사용 가능합니다.",
                    }}
                    formData={formData}
                    updateFormField={updateFormField}
                    currentNodeId={id}
                  />
                );
              }
              // Handle status field (number | {min?: number, max?: number})
              if (field.name === "status") {
                return (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">
                      {field.name}
                      {field.optional && " (선택)"}
                    </label>
                    {field.description && (
                      <p className="text-xs text-gray-500">
                        {field.description}
                      </p>
                    )}
                    <input
                      type="text"
                      value={
                        typeof formData[field.name] === "object"
                          ? JSON.stringify(formData[field.name])
                          : formData[field.name] || ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          updateFormField(field.name, undefined);
                        } else {
                          // Try to parse as JSON for range {min: x, max: y}
                          try {
                            if (value.includes("{")) {
                              const parsed = JSON.parse(value);
                              updateFormField(field.name, parsed);
                            } else {
                              // Parse as number
                              const num = parseInt(value, 10);
                              updateFormField(
                                field.name,
                                isNaN(num) ? value : num,
                              );
                            }
                          } catch {
                            // If not valid JSON, try as number
                            const num = parseInt(value, 10);
                            updateFormField(
                              field.name,
                              isNaN(num) ? value : num,
                            );
                          }
                        }
                      }}
                      placeholder={
                        '상태 코드 (예: 200) 또는 범위 (예: {"min": 200, "max": 299})'
                      }
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      특정 상태 코드 또는 범위를 지정할 수 있습니다.
                    </p>
                  </div>
                );
              }
              // Default union handling - treat as string
              return (
                <StringFieldBlock
                  key={field.name}
                  field={field}
                  formData={formData}
                  updateFormField={updateFormField}
                  currentNodeId={id}
                />
              );
            } else if (field.type === "object") {
              // For textFilter in EventClickBlock
              if (field.name === "textFilter") {
                return (
                  <TextFilterFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
              // For conditions in WaitForConditionBlock
              if (field.name === "conditions") {
                return (
                  <ConditionsFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
              // For notification in CheckStatusBlock
              if (field.name === "notification" && blockName === "check-status") {
                return (
                  <NotificationFieldBlock
                    key={field.name}
                    field={field}
                    formData={formData}
                    updateFormField={updateFormField}
                  />
                );
              }
            }

            return null;
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
