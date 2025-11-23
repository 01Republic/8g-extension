import type { ParsedField } from "~/lib/schema-parser";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface ExtractorsFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

interface Extractor {
  type: "text" | "attribute" | "cssSelector" | "xpath";
  selector?: string;
  attribute?: string;
  saveAs: string;
}

const EXTRACTOR_TYPES = [
  { value: "text", label: "텍스트" },
  { value: "attribute", label: "속성" },
  { value: "cssSelector", label: "CSS 셀렉터" },
  { value: "xpath", label: "XPath" },
];

export const ExtractorsFieldBlock = (props: ExtractorsFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  const currentExtractors: Extractor[] = formData[name] || [];

  const addExtractor = () => {
    const newExtractors = [
      ...currentExtractors,
      {
        type: "text" as const,
        selector: "",
        saveAs: "",
      },
    ];
    updateFormField(name, newExtractors);
  };

  const removeExtractor = (index: number) => {
    const newExtractors = currentExtractors.filter((_, i) => i !== index);
    updateFormField(name, newExtractors.length > 0 ? newExtractors : undefined);
  };

  const updateExtractor = (index: number, key: keyof Extractor, value: string) => {
    const newExtractors = [...currentExtractors];
    if (key === "type") {
      newExtractors[index] = {
        ...newExtractors[index],
        [key]: value as Extractor["type"],
        // type 변경 시 불필요한 필드 제거
        selector: value === "cssSelector" || value === "xpath" ? "" : newExtractors[index].selector,
        attribute: value === "attribute" ? "" : undefined,
      };
    } else {
      (newExtractors[index] as any)[key] = value || undefined;
    }
    updateFormField(name, newExtractors);
  };

  return (
    <FieldBlockContentBox key={name} label="데이터 추출 설정">
      <div className="space-y-4">
        {currentExtractors.map((extractor, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">추출기 {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeExtractor(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700">추출 타입</label>
                <Select
                  value={extractor.type}
                  onValueChange={(v) => updateExtractor(index, "type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRACTOR_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">저장할 키 이름</label>
                <Input
                  value={extractor.saveAs}
                  onChange={(e) => updateExtractor(index, "saveAs", e.target.value)}
                  placeholder="예: title, price"
                />
              </div>
            </div>

            {(extractor.type === "text" && (
              <div>
                <label className="text-xs font-medium text-gray-700">셀렉터</label>
                <Input
                  value={extractor.selector || ""}
                  onChange={(e) => updateExtractor(index, "selector", e.target.value)}
                  placeholder="CSS 셀렉터 (예: .title)"
                />
              </div>
            ))}

            {extractor.type === "attribute" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">셀렉터</label>
                  <Input
                    value={extractor.selector || ""}
                    onChange={(e) => updateExtractor(index, "selector", e.target.value)}
                    placeholder="CSS 셀렉터"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">속성 이름</label>
                  <Input
                    value={extractor.attribute || ""}
                    onChange={(e) => updateExtractor(index, "attribute", e.target.value)}
                    placeholder="예: href, src, data-id"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addExtractor}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          추출기 추가
        </Button>
      </div>
    </FieldBlockContentBox>
  );
};