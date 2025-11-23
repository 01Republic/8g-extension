import type { ParsedField } from "~/lib/schema-parser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface KeyFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

const COMMON_KEYS = [
  "Enter",
  "Escape",
  "Tab",
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Backspace",
  "Delete",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
];

export const KeyFieldBlock = (props: KeyFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  return (
    <FieldBlockContentBox key={name} label={name}>
      <Select
        value={formData[name] ?? ""}
        onValueChange={(v) => updateFormField(name, v || undefined)}
      >
        <SelectTrigger className="min-w-40">
          <SelectValue placeholder="키 선택" />
        </SelectTrigger>
        <SelectContent>
          {COMMON_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldBlockContentBox>
  );
};