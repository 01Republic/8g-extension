// Re-export types from shared
export type {
  Workflow,
  WorkflowStep,
  RepeatConfig,
  Condition,
  JsonCondition,
  Binding,
  BindingValue,
} from '8g-shared';

// Re-export block types
export * from './blocks/types';

// Workflow execution result types
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