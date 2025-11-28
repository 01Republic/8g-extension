// Main entry point for @8g/workflow-engine

// Core workflow runner
export { WorkflowRunner } from './workflow/WorkflowRunner';
export type { WorkflowStepRunResult, TabCreator } from './workflow/WorkflowRunner';

// Context management
export * from './workflow/context';

// Step execution
export * from './workflow/step-executor';

// DOM abstraction
export * from './dom';

// Types (specific exports to avoid conflicts)
export type {
  Block,
  BlockResult,
} from './types';

// Re-export from 8g-shared
export type {
  Workflow,
  WorkflowStep,
  RepeatConfig,
  Condition,
  JsonCondition,
  Binding,
  BindingValue,
} from '8g-shared';

// Blocks
export * from './blocks';