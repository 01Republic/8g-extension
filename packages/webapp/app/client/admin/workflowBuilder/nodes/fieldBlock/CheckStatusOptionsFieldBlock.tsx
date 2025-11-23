import type { ParsedField } from "~/lib/schema-parser";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface CheckStatusOptionsFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const CheckStatusOptionsFieldBlock = (props: CheckStatusOptionsFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  const currentOptions = formData[name] || {};

  const updateOptionField = (key: string, value: any) => {
    const updatedOptions = {
      ...currentOptions,
      [key]: value,
    };

    // 빈 값이면 필드 제거
    if (value === undefined || value === "" || value === false) {
      delete updatedOptions[key];
    }

    // 객체가 비어있으면 undefined로 설정
    const hasValues = Object.keys(updatedOptions).length > 0;
    updateFormField(name, hasValues ? updatedOptions : undefined);
  };

  return (
    <FieldBlockContentBox key={name} label="고급 옵션">
      <div className="space-y-4">
        {/* Timeout */}
        <div>
          <label className="text-xs font-medium text-gray-700">타임아웃 (ms)</label>
          <Input
            type="number"
            value={currentOptions.timeoutMs || ""}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
              updateOptionField("timeoutMs", value);
            }}
            placeholder="기본값: 60000"
          />
        </div>

        {/* Retryable */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}-retryable`}
            checked={currentOptions.retryable || false}
            onCheckedChange={(checked) => updateOptionField("retryable", checked)}
          />
          <label
            htmlFor={`${name}-retryable`}
            className="text-sm font-medium leading-none"
          >
            재시도 가능
          </label>
        </div>

        {/* Auto Click */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}-autoClick`}
            checked={currentOptions.autoClick || false}
            onCheckedChange={(checked) => updateOptionField("autoClick", checked)}
          />
          <label
            htmlFor={`${name}-autoClick`}
            className="text-sm font-medium leading-none"
          >
            CDP 자동 클릭 활성화
          </label>
        </div>

        {/* Click Delay (CDP 자동 클릭이 활성화된 경우만 표시) */}
        {currentOptions.autoClick && (
          <div className="ml-6">
            <label className="text-xs font-medium text-gray-700">클릭 전 대기 시간 (ms)</label>
            <Input
              type="number"
              value={currentOptions.clickDelay || ""}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                updateOptionField("clickDelay", value);
              }}
              placeholder="기본값: 1000"
            />
          </div>
        )}

        {/* Fallback to Manual (CDP 자동 클릭이 활성화된 경우만 표시) */}
        {currentOptions.autoClick && (
          <div className="ml-6 flex items-center space-x-2">
            <Checkbox
              id={`${name}-fallbackToManual`}
              checked={currentOptions.fallbackToManual || false}
              onCheckedChange={(checked) => updateOptionField("fallbackToManual", checked)}
            />
            <label
              htmlFor={`${name}-fallbackToManual`}
              className="text-sm font-medium leading-none"
            >
              자동 클릭 실패 시 수동 모드로 전환
            </label>
          </div>
        )}

        {/* Custom Validator */}
        <div>
          <label className="text-xs font-medium text-gray-700">사용자 정의 검증 로직</label>
          <Input
            value={currentOptions.customValidator || ""}
            onChange={(e) => updateOptionField("customValidator", e.target.value || undefined)}
            placeholder="JavaScript 코드"
          />
          <p className="text-xs text-gray-500 mt-1">
            고급 사용자를 위한 사용자 정의 검증 함수
          </p>
        </div>
      </div>
    </FieldBlockContentBox>
  );
};