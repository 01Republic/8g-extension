import type { WhenCondition } from "~/models/workflow/types";
import type { EdgeFormState } from "../edgeDataConverter";
import type { SubCondition, ValueType } from "../types";
import { BaseConditionStrategy } from "./types";
import {
  extractNodeIdFromPath,
  extractPathFromJsonPath,
  buildJsonPath,
} from "../../../utils/conditionUtils";

/**
 * 값의 타입을 감지
 */
function detectValueType(value: any): ValueType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "string";
}

/**
 * 값을 지정된 타입으로 변환
 */
function convertValue(
  value: string | number | boolean,
  valueType: ValueType,
): string | number | boolean {
  switch (valueType) {
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "string")
        return value.toLowerCase() === "true" || value === "1";
      return Boolean(value);
    case "number":
      if (typeof value === "number") return value;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    default:
      return String(value);
  }
}

/**
 * Equals 조건 전략
 */
export class EqualsStrategy extends BaseConditionStrategy {
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void {
    if (!when.equals) return;

    const rightValue = when.equals.right;
    const valueType = detectValueType(rightValue);

    formState.equalsData = {
      nodeId: extractNodeIdFromPath(when.equals.left || ""),
      path: extractPathFromJsonPath(when.equals.left || "") || "result.data",
      value: rightValue ?? "",
      valueType,
    };
  }

  buildWhen(formState: EdgeFormState): WhenCondition {
    const { nodeId, path, value, valueType } = formState.equalsData;
    const leftPath = buildJsonPath(nodeId, path);
    const convertedValue = convertValue(value, valueType);
    return {
      equals: { left: leftPath, right: convertedValue },
    };
  }

  getLabel(formState: EdgeFormState): string {
    return `== ${formState.equalsData.value}`;
  }

  buildFromSubCondition(sub: SubCondition): WhenCondition {
    const fullPath = buildJsonPath(sub.nodeId, sub.path);
    const valueType = sub.valueType || "string";
    const convertedValue = convertValue(sub.value ?? "", valueType);
    return {
      equals: { left: fullPath, right: convertedValue },
    };
  }

  parseToSubCondition(when: WhenCondition, id: string): SubCondition | null {
    if (!when.equals) return null;

    const nodeId = extractNodeIdFromPath(when.equals.left || "");
    const path =
      extractPathFromJsonPath(when.equals.left || "") || "result.data";
    const rightValue = when.equals.right;
    const valueType = detectValueType(rightValue);

    return {
      id,
      type: "equals",
      nodeId,
      path,
      value: rightValue ?? "",
      valueType,
    };
  }
}
