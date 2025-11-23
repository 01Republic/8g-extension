import type { ParsedField } from "~/lib/schema-parser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface EnumFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const EnumFieldBlock = (props: EnumFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name, enumValues } = field;

  return (
    <FieldBlockContentBox key={name} label={name}>
      <Select
        value={formData[name] ?? ""}
        onValueChange={(v) => updateFormField(name, v || undefined)}
      >
        <SelectTrigger className="min-w-40">
          <SelectValue placeholder={`${name} 선택`} />
        </SelectTrigger>
        <SelectContent>
          {enumValues?.map((val) => (
            <SelectItem key={val} value={val}>
              {val}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldBlockContentBox>
  );
};
