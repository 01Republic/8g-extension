import { Label } from "~/components/ui/label";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { Input } from "~/components/ui/input";
import type { ParsedField } from "~/lib/schema-parser";

interface ArrayFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const ArrayFieldBlock = (props: ArrayFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  const arrayValue = Array.isArray(formData[name])
    ? formData[name].join(", ")
    : "";

  return (
    <FieldBlockContentBox key={name} label={name}>
      <Input
        id={name}
        value={arrayValue}
        onChange={(e) => {
          const arr = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          updateFormField(name, arr.length > 0 ? arr : undefined);
        }}
        placeholder="쉼표로 구분 (예: href, src, class)"
      />
    </FieldBlockContentBox>
  );
};
