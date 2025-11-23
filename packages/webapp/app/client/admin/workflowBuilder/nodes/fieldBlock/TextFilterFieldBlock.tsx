import { Label } from "~/components/ui/label";
import type { ParsedField } from "~/lib/schema-parser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface TextFilterFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const TextFilterFieldBlock = (props: TextFilterFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  return (
    <FieldBlockContentBox key={name} label="텍스트 필터">
      <Input
        placeholder="필터할 텍스트"
        value={formData[name]?.text ?? ""}
        onChange={(e) => {
          const newText = e.target.value;
          if (!newText) {
            updateFormField(name, undefined);
          } else {
            updateFormField(name, {
              ...formData[name],
              text: newText,
              mode: formData[name]?.mode ?? "exact",
            });
          }
        }}
      />
      <Select
        value={formData[name]?.mode ?? "exact"}
        onValueChange={(v) =>
          updateFormField(name, {
            ...formData[name],
            mode: v,
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="exact">정확히 일치</SelectItem>
          <SelectItem value="contains">포함</SelectItem>
          <SelectItem value="startsWith">시작</SelectItem>
          <SelectItem value="endsWith">끝</SelectItem>
          <SelectItem value="regex">정규식</SelectItem>
        </SelectContent>
      </Select>
    </FieldBlockContentBox>
  );
};
