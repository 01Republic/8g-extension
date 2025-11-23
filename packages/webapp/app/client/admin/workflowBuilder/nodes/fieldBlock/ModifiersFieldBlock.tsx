import type { ParsedField } from "~/lib/schema-parser";
import { Checkbox } from "~/components/ui/checkbox";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface ModifiersFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

const MODIFIERS = [
  { value: "ctrl", label: "Ctrl" },
  { value: "shift", label: "Shift" },
  { value: "alt", label: "Alt" },
  { value: "meta", label: "Meta (⌘)" },
];

export const ModifiersFieldBlock = (props: ModifiersFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name } = field;

  const currentModifiers = formData[name] || [];

  const handleModifierChange = (modifier: string, checked: boolean) => {
    let updatedModifiers;
    
    if (checked) {
      updatedModifiers = [...currentModifiers, modifier];
    } else {
      updatedModifiers = currentModifiers.filter((m: string) => m !== modifier);
    }

    updateFormField(name, updatedModifiers.length > 0 ? updatedModifiers : undefined);
  };

  return (
    <FieldBlockContentBox key={name} label={name}>
      <div className="grid grid-cols-2 gap-4">
        {MODIFIERS.map((modifier) => (
          <div key={modifier.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${name}-${modifier.value}`}
              checked={currentModifiers.includes(modifier.value)}
              onCheckedChange={(checked) =>
                handleModifierChange(modifier.value, checked === true)
              }
            />
            <label
              htmlFor={`${name}-${modifier.value}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {modifier.label}
            </label>
          </div>
        ))}
      </div>
    </FieldBlockContentBox>
  );
};