import { useState } from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ParsedField } from "~/lib/schema-parser";
import { FieldBlockContentBox } from "./FieldBlockContentBox";
import { fieldLabels } from "../index";

interface ConditionsFieldBlockProps {
  field: ParsedField;
  formData: Record<string, any>;
  updateFormField: (fieldName: string, value: any) => void;
}

export const ConditionsFieldBlock = (props: ConditionsFieldBlockProps) => {
  const { field, formData, updateFormField } = props;
  const { name, nestedFields = [] } = field;

  const currentConditions = formData[name] || {};

  const updateConditionField = (conditionKey: string, value: any) => {
    updateFormField(name, {
      ...currentConditions,
      [conditionKey]: value,
    });
  };

  const removeConditionField = (conditionKey: string) => {
    const updated = { ...currentConditions };
    delete updated[conditionKey];
    updateFormField(name, updated);
  };

  return (
    <FieldBlockContentBox label={fieldLabels[name] || name} location="top">
      <div className="flex flex-col gap-3 w-full border border-gray-200 rounded-md p-4">
        {nestedFields.map((nestedField) => {
          const { name: condKey, type, optional } = nestedField;
          const isActive = condKey in currentConditions;
          const condValue = currentConditions[condKey];

          return (
            <div key={condKey} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Initialize with default value based on type
                      if (type === "boolean") {
                        updateConditionField(condKey, false);
                      } else if (type === "object") {
                        updateConditionField(condKey, {});
                      } else {
                        updateConditionField(condKey, "");
                      }
                    } else {
                      removeConditionField(condKey);
                    }
                  }}
                />
                <Label className="text-sm font-medium">
                  {fieldLabels[condKey] || condKey}
                </Label>
              </div>

              {isActive && (
                <div className="ml-6">
                  {type === "string" && (
                    <Input
                      value={condValue || ""}
                      onChange={(e) =>
                        updateConditionField(
                          condKey,
                          e.target.value || undefined,
                        )
                      }
                      placeholder={fieldLabels[condKey] || condKey}
                    />
                  )}

                  {type === "boolean" && (
                    <Checkbox
                      checked={condValue || false}
                      onCheckedChange={(checked) =>
                        updateConditionField(condKey, checked)
                      }
                    />
                  )}

                  {type === "object" && nestedField.nestedFields && (
                    <div className="flex flex-col gap-2 border border-gray-200 rounded-md p-3">
                      {nestedField.nestedFields.map((subField) => {
                        const subValue =
                          (condValue as any)?.[subField.name] || "";
                        return (
                          <div
                            key={subField.name}
                            className="flex flex-col gap-1"
                          >
                            <Label className="text-xs">
                              {fieldLabels[subField.name] || subField.name}
                            </Label>
                            {subField.type === "string" && (
                              <Input
                                value={subValue}
                                onChange={(e) =>
                                  updateConditionField(condKey, {
                                    ...(condValue || {}),
                                    [subField.name]:
                                      e.target.value || undefined,
                                  })
                                }
                              />
                            )}
                            {subField.type === "enum" &&
                              subField.enumValues && (
                                <Select
                                  value={subValue}
                                  onValueChange={(v) =>
                                    updateConditionField(condKey, {
                                      ...(condValue || {}),
                                      [subField.name]: v,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subField.enumValues.map((enumVal) => (
                                      <SelectItem key={enumVal} value={enumVal}>
                                        {enumVal}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FieldBlockContentBox>
  );
};
