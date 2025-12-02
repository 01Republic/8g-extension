// 값 타입 (string, number, boolean)
export type ValueType = "string" | "number" | "boolean";

// and/or 조건용 - 동적 UI로 관리
export type SubConditionType = "equals" | "contains" | "exists" | "regex";

export interface SubCondition {
  id: string;
  type: SubConditionType;
  nodeId: string;
  path: string;
  value?: string | number | boolean; // equals의 right, contains의 substring, regex의 pattern
  valueType?: ValueType; // 값 타입 정보
}

export type ConditionMode = "single" | "multiple";

export type SingleConditionType =
  | "default"
  | "equals"
  | "exists"
  | "expr"
  | "regex"
  | "contains";

export type MultipleConditionType = "and" | "or";
