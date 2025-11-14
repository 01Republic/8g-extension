import type { RepeatConfig, WorkflowStep, WorkflowStepRunResult } from '@/sdk/types';
import type { ExecutionContext } from '../context';
import {
  enterForEachInContext,
  enterLoopInContext,
  exitLoopInContext,
  setStepResultInContext,
} from '../context';
import { executeStep } from './step-execution';
import { getNextStepId, waitAfterStep } from './step-routing';
import { resolveRepeatItems } from './repeat-executor';
import type { BlockExecutor } from './types';

// TODO : 이건 차후 직접 코드 정리 필요!!! made by llm
export type SegmentRunOptions = {
  currentId: string | undefined;
  context: ExecutionContext;
  stepsById: Map<string, WorkflowStep>;
  tabId: number;
  executeBlock: BlockExecutor;
  stopBeforeStepId?: string;
  skipRepeatStepIds?: Set<string>;
};

export type SegmentRunResult = {
  results: WorkflowStepRunResult<any>[];
  context: ExecutionContext;
  nextStepId?: string;
};

export const executeWorkflowSegment = async (
  options: SegmentRunOptions
): Promise<SegmentRunResult> => {
  const { stepsById, tabId, stopBeforeStepId, skipRepeatStepIds, executeBlock } = options;
  let { currentId, context } = options;
  const results: WorkflowStepRunResult<any>[] = [];

  while (currentId && currentId !== stopBeforeStepId) {
    const step = stepsById.get(currentId);
    if (!step) break;
    console.log('step', step);

    if (step.repeat?.scope === 'subtree' && !skipRepeatStepIds?.has(step.id)) {
      const repeatOutcome = await executeSubtreeRepeat({
        step,
        repeatConfig: step.repeat,
        context,
        stepsById,
        tabId,
        executeBlock,
        inheritedSkipSet: skipRepeatStepIds,
      });
      results.push(...repeatOutcome.results);
      context = repeatOutcome.context;
      currentId = repeatOutcome.nextStepId;
      continue;
    }

    const stepResult = await executeStep(step, context, executeBlock, tabId);
    console.log('stepResult', stepResult);

    results.push(stepResult);
    context = stepResult.context;

    const nextId = getNextStepId(step, stepResult.success, context);

    if (nextId && !stepResult.skipped) {
      await waitAfterStep(step);
    }

    currentId = nextId;
  }

  return { results, context, nextStepId: currentId };
};

const executeSubtreeRepeat = async (params: {
  step: WorkflowStep;
  repeatConfig: RepeatConfig;
  context: ExecutionContext;
  stepsById: Map<string, WorkflowStep>;
  tabId: number;
  executeBlock: BlockExecutor;
  inheritedSkipSet?: Set<string>;
}): Promise<SegmentRunResult> => {
  const { step, repeatConfig, stepsById, tabId, executeBlock, inheritedSkipSet } = params;
  if (!repeatConfig.subtreeEnd) {
    throw new Error(`subtree repeat requires 'subtreeEnd' on step ${step.id}`);
  }

  let updatedContext = params.context;
  const aggregatedResults: WorkflowStepRunResult<any>[] = [];
  const iterationSummaries: Array<{
    index: number;
    success: boolean;
    steps: Array<
      Pick<WorkflowStepRunResult<any>, 'stepId' | 'success' | 'skipped' | 'message' | 'result'>
    >;
  }> = [];
  const errors: Array<{ index: number; message: string }> = [];

  const { items, isForEach } = resolveRepeatItems(repeatConfig, updatedContext);

  for (let index = 0; index < items.length; index++) {
    const item = items[index];

    updatedContext = isForEach
      ? enterForEachInContext(updatedContext, item, index, items.length)
      : enterLoopInContext(updatedContext, index, items.length);

    try {
      const skipSet = new Set(inheritedSkipSet ?? []);
      skipSet.add(step.id);
      const iterationRun = await executeWorkflowSegment({
        currentId: step.id,
        context: updatedContext,
        stepsById,
        tabId,
        executeBlock,
        stopBeforeStepId: repeatConfig.subtreeEnd,
        skipRepeatStepIds: skipSet,
      });

      aggregatedResults.push(...iterationRun.results);
      updatedContext = iterationRun.context;

      const iterationSuccess = iterationRun.results.every((r) => r.success || r.skipped);
      iterationSummaries.push({
        index,
        success: iterationSuccess,
        steps: iterationRun.results.map((r) => ({
          stepId: r.stepId,
          success: r.success,
          skipped: r.skipped,
          message: r.message,
          result: r.result,
        })),
      });

      if (!iterationSuccess) {
        errors.push({
          index,
          message: iterationRun.results.find((r) => !r.success)?.message || 'Subtree iteration failed',
        });
        if (!repeatConfig.continueOnError) {
          updatedContext = exitLoopInContext(updatedContext);
          return finalizeSubtreeRepeat({
            step,
            repeatConfig,
            aggregatedResults,
            iterationSummaries,
            errors,
            totalIterations: items.length,
            context: updatedContext,
          });
        }
      }
    } catch (e: any) {
      errors.push({
        index,
        message: e?.message || 'Subtree iteration threw error',
      });
      if (!repeatConfig.continueOnError) {
        updatedContext = exitLoopInContext(updatedContext);
        return finalizeSubtreeRepeat({
          step,
          repeatConfig,
          aggregatedResults,
          iterationSummaries,
          errors,
          totalIterations: items.length,
          context: updatedContext,
        });
      }
    }

    if (repeatConfig.delayBetween && index < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, repeatConfig.delayBetween));
    }
  }

  updatedContext = exitLoopInContext(updatedContext);

  return finalizeSubtreeRepeat({
    step,
    repeatConfig,
    aggregatedResults,
    iterationSummaries,
    errors,
    totalIterations: items.length,
    context: updatedContext,
  });
};

const finalizeSubtreeRepeat = (params: {
  step: WorkflowStep;
  repeatConfig: RepeatConfig;
  aggregatedResults: WorkflowStepRunResult<any>[];
  iterationSummaries: Array<{
    index: number;
    success: boolean;
    steps: Array<
      Pick<WorkflowStepRunResult<any>, 'stepId' | 'success' | 'skipped' | 'message' | 'result'>
    >;
  }>;
  errors: Array<{ index: number; message: string }>;
  totalIterations: number;
  context: ExecutionContext;
}): SegmentRunResult => {
  const { step, repeatConfig, aggregatedResults, iterationSummaries, errors, totalIterations } =
    params;
  const summary = {
    hasError: errors.length > 0 && !repeatConfig.continueOnError,
    message:
      errors.length > 0
        ? `Subtree repeat completed with ${errors.length} error(s) out of ${totalIterations}`
        : `Subtree repeat completed ${totalIterations} iteration(s)`,
    data: {
      iterations: iterationSummaries,
      errors,
    },
  };

  const updatedContext = setStepResultInContext(params.context, step.id, {
    result: summary,
    success: !summary.hasError,
    skipped: totalIterations === 0,
  });

  const lastIndex = findLastStepIndex(aggregatedResults, step.id);
  if (lastIndex >= 0) {
    const enriched = {
      ...aggregatedResults[lastIndex],
      result: summary,
      success: !summary.hasError,
      message: summary.message,
    };
    (enriched as any).context = updatedContext;
    aggregatedResults[lastIndex] = enriched;
  } else {
    const now = new Date().toISOString();
    const enriched = {
      stepId: step.id,
      skipped: totalIterations === 0,
      success: !summary.hasError,
      message: summary.message,
      result: summary,
      startedAt: now,
      finishedAt: now,
      attempts: 0,
    };
    (enriched as any).context = updatedContext;
    aggregatedResults.push(enriched as WorkflowStepRunResult<any>);
  }

  return {
    results: aggregatedResults,
    context: updatedContext,
    nextStepId: repeatConfig.subtreeEnd,
  };
};

const findLastStepIndex = (results: WorkflowStepRunResult<any>[], stepId: string): number => {
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].stepId === stepId) {
      return i;
    }
  }
  return -1;
};

