import type { ParsedField } from "~/lib/schema-parser";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { Checkbox } from "~/components/ui/checkbox";

interface NotificationFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const NotificationFieldBlock = (props: NotificationFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  const currentValue = formData[name] || {};
  const isEnabled = Object.keys(currentValue).length > 0;

  const updateNotificationField = (key: string, value: any) => {
    const updatedNotification = {
      ...currentValue,
      [key]: value,
    };

    // 빈 값이면 필드 제거
    if (!value || value === "") {
      delete updatedNotification[key];
    }

    // 객체가 비어있으면 undefined로 설정
    const hasValues = Object.keys(updatedNotification).length > 0;
    updateFormField(name, hasValues ? updatedNotification : undefined);
  };

  const toggleNotification = (enabled: boolean) => {
    if (enabled) {
      updateFormField(name, {
        message: "",
        urgency: "medium",
      });
    } else {
      updateFormField(name, undefined);
    }
  };

  return (
    <FieldBlockContentBox key={name} label="알림 설정">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}-enabled`}
            checked={isEnabled}
            onCheckedChange={(checked) => toggleNotification(checked === true)}
          />
          <label
            htmlFor={`${name}-enabled`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            알림 활성화
          </label>
        </div>

        {isEnabled && (
          <div className="space-y-3 ml-6">
            <div>
              <label className="text-xs font-medium text-gray-700">메시지</label>
              <Input
                value={currentValue.message || ""}
                onChange={(e) => updateNotificationField("message", e.target.value)}
                placeholder="알림 메시지"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">긴급도</label>
              <Select
                value={currentValue.urgency || "medium"}
                onValueChange={(v) => updateNotificationField("urgency", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="긴급도 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">중간</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </FieldBlockContentBox>
  );
};