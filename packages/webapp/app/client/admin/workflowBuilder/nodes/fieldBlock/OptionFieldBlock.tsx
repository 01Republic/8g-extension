import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ParsedField } from "~/lib/schema-parser";
import { FieldBlockContentBox } from "./FieldBlockContentBox";

interface OptionFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateOptionField: (optionKey: string, value: any) => void;
}

export const OptionFieldBlock = (props: OptionFieldBlockProps) => {
  const { field, formData, updateOptionField } = props;

  return (
    <FieldBlockContentBox key={field.name} label="옵션" location="top">
      <div className="flex gap-2 flex-col">
        <Label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={formData.option?.waitForSelector ?? false}
            onChange={(e) =>
              updateOptionField("waitForSelector", e.target.checked)
            }
          />
          <span>셀렉터 대기</span>
        </Label>
        <Label htmlFor="waitSelectorTimeout">
          <span className="whitespace-nowrap w-80 text-base">
            대기 시간 (ms)
          </span>

          <Input
            id="waitSelectorTimeout"
            type="number"
            value={formData.option?.waitSelectorTimeout ?? ""}
            onChange={(e) =>
              updateOptionField(
                "waitSelectorTimeout",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            placeholder="2000"
          />
        </Label>
        <Label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={formData.option?.multiple ?? false}
            onChange={(e) => updateOptionField("multiple", e.target.checked)}
          />
          <span>다중 선택</span>
        </Label>
      </div>
    </FieldBlockContentBox>
  );
};
