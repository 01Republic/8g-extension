import { FieldBlockContentBox } from "./FieldBlockContentBox";
import type { ParsedField } from "~/lib/schema-parser";

interface BooleanFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const BooleanFieldBlock = (props: BooleanFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  return (
    <FieldBlockContentBox key={name}>
      <label className="flex items-center gap-2 text-base">
        <input
          type="checkbox"
          checked={formData[name] ?? false}
          onChange={(e) => updateFormField(name, e.target.checked)}
        />
        <span>{name}</span>
      </label>
    </FieldBlockContentBox>
  );
};
