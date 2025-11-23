import { Label } from "~/components/ui/label";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { Input } from "~/components/ui/input";
import type { ParsedField } from "~/lib/schema-parser";

interface NumberFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const NumberFieldBlock = (props: NumberFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name, defaultValue } = field;

  return (
    <FieldBlockContentBox key={name} label={name}>
      <Input
        id={name}
        type="number"
        value={formData[name] ?? ""}
        onChange={(e) =>
          updateFormField(
            name,
            e.target.value ? Number(e.target.value) : undefined,
          )
        }
        placeholder={defaultValue || "ms 단위로 입력해주세요."}
        className="max-w-48"
      />
    </FieldBlockContentBox>
  );
};
