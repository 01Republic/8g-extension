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

export interface Condition {
  expr?: ExpressionString;
  json?: JsonCondition;
}

export type BindingValue = string | number | boolean | null | Record<string, any> | any[];

export interface Binding {
  template?: string;
  valueFrom?: string;
  default?: BindingValue;
}

export interface WorkflowStep {
  id: string;
  title?: string;
  when?: Condition;
  block?: Block; // BlockBase 호환. 바인딩은 런타임에서 해석
  next?: string;
  onSuccess?: string;
  onFailure?: string;
  switch?: Array<{ when: Condition; next: string }>;
  timeoutMs?: number;
  retry?: { attempts: number; delayMs?: number; backoffFactor?: number };
  delayAfterMs?: number;
  setVars?: Record<string, Binding | BindingValue>;
}

export interface Workflow {
  version: '1.0';
  id?: string;
  title?: string;
  description?: string;
  start: string;
  steps: WorkflowStep[];
  defaultDelayMs?: number;
}

export type CollectWorkflowRequest = {
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
};

export interface WorkflowStepRunResult<T = any> {
  stepId: string;
  skipped: boolean;
  success: boolean;
  message?: string;
  result?: T;
  startedAt: string;
  finishedAt: string;
  attempts: number;
}

export interface CollectWorkflowResult<T = any> {
  success: boolean;
  steps: WorkflowStepRunResult<T>[];
  targetUrl: string;
  timestamp: string;
  error?: string;
}
