import { Block } from '../blocks';
export * from '../blocks';

// =========================
// Workflow Types
// =========================

export type ExpressionString = string;

export type JsonCondition =
  | { exists: string }
  | { equals: { left: string; right: any } }
  | { notEquals: { left: string; right: any } }
  | { contains: { value: string; search: any } }
  | { regex: { value: string; pattern: string; flags?: string } }
  | { and: JsonCondition[] }
  | { or: JsonCondition[] }
  | { not: JsonCondition };

export class Condition {
  expr?: ExpressionString;
  json?: JsonCondition;
}

export type BindingValue = string | number | boolean | null | Record<string, any> | any[];

export class Binding {
  template?: string;
  valueFrom?: string;
  default?: BindingValue;
}

export type ForEachConfig = {
  forEach: string;  // 배열 경로 (예: '$.steps.getIds.result.data')
  continueOnError?: boolean;  // 에러 발생해도 계속 진행
  delayBetween?: number;  // 반복 사이 대기 시간 (ms)
};

export type LoopConfig = {
  count: number | string;  // 반복 횟수 (숫자 또는 바인딩 경로)
  continueOnError?: boolean;  // 에러 발생해도 계속 진행
  delayBetween?: number;  // 반복 사이 대기 시간 (ms)
};

export type RepeatConfig = ForEachConfig | LoopConfig;

export class WorkflowStep {
  id!: string;
  title?: string;
  when?: Condition;
  block?: Block; // BlockBase 호환. 바인딩은 런타임에서 해석
  repeat?: RepeatConfig;  // 반복 설정 (forEach 또는 count)`  
  next?: string;
  onSuccess?: string;
  onFailure?: string;
  switch?: Array<{ when: Condition; next: string }>;
  timeoutMs?: number;
  retry?: { attempts: number; delayMs?: number; backoffFactor?: number };
  delayAfterMs?: number;
  setVars?: Record<string, Binding | BindingValue>;
}

export class Workflow {
  version!: '1.0';
  id?: string;
  title?: string;
  description?: string;
  start!: string;
  steps!: WorkflowStep[];
  defaultDelayMs?: number;
}

export type CollectWorkflowRequest = {
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
};

export class WorkflowStepRunResult<T = any> {
  stepId!: string;
  skipped!: boolean;
  success!: boolean;
  message?: string;
  result?: T;
  startedAt!: string;
  finishedAt!: string;
  attempts!: number;
}

export class CollectWorkflowResult<T = any> {
  success!: boolean;
  steps!: WorkflowStepRunResult<T>[];
  targetUrl!: string;
  timestamp!: string;
  error?: string;
}
