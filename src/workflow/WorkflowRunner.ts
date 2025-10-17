import type { Workflow, WorkflowStepRunResult } from '@/sdk/types';
import { createExecutionContext, setVarsInContext } from './context';
import {
  executeStep,
  getNextStepId,
  waitAfterStep,
  type BlockExecutor,
} from './step-executor';

export class WorkflowRunner {
  constructor(private executeBlock: BlockExecutor) {}

  async run(workflow: Workflow, tabId: number) {
    let context = createExecutionContext();

    // workflow.vars가 있으면 초기 변수 설정
    if (workflow.vars) {
      context = setVarsInContext(context, workflow.vars);
    }

    const stepsById = new Map(workflow.steps.map((s) => [s.id, s]));
    let currentId: string | undefined = workflow.start;
    const results: WorkflowStepRunResult<any>[] = [];

    while (currentId) {
      const step = stepsById.get(currentId);
      if (!step) break;

      // 1. Step 실행
      const stepResult = await executeStep(step, context, this.executeBlock, tabId);

      // 2. 결과 기록
      results.push(stepResult);
      context = stepResult.context;

      // 3. 다음 step 결정
      const nextId = getNextStepId(step, stepResult.success, context);

      // 4. Step 후 대기 (다음 step이 있는 경우에만)
      if (nextId && !stepResult.skipped) {
        await waitAfterStep(step);
      }

      currentId = nextId;
    }

    return { steps: results };
  }
}
