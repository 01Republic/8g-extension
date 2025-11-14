import type { Workflow, WorkflowStepRunResult } from '@/sdk/types';
import { createExecutionContext, setVarsInContext, resolveBindings } from './context';
import { executeStep, getNextStepId, waitAfterStep, type BlockExecutor } from './step-executor';

export type TabCreator = (
  targetUrl: string,
  activateTab: boolean,
  originTabId?: number
) => Promise<number>;
export type ExecutionStatusController = {
  show: (tabId: number, message?: string) => Promise<void>;
  hide: (tabId: number) => Promise<void>;
};

export class WorkflowRunner {
  constructor(
    private executeBlock: BlockExecutor,
    private createTab: TabCreator,
    private statusController?: ExecutionStatusController
  ) {}

  async run(
    workflow: Workflow,
    targetUrl: string,
    activateTab: boolean = false,
    originTabId?: number
  ) {
    let context = createExecutionContext();

    // workflow.vars가 있으면 초기 변수 설정
    if (workflow.vars) {
      context = setVarsInContext(context, workflow.vars);
    }

    console.log('context', workflow.vars);
    console.log('targetUrl', targetUrl);
    console.log(context);
    // targetUrl 바인딩 처리 (vars를 사용할 수 있도록)
    const resolvedTargetUrl =
      typeof targetUrl === 'string' ? resolveBindings(targetUrl, context) : targetUrl;
    console.log('resolvedTargetUrl', resolvedTargetUrl);

    // 탭 생성
    const tabId = await this.createTab(resolvedTargetUrl, activateTab, originTabId);

    try {
      // 실행 상태 UI 표시
      await this.statusController?.show(tabId, '워크플로우 실행 중');

      const stepsById = new Map(workflow.steps.map((s) => [s.id, s]));
      let currentId: string | undefined = workflow.start;
      const results: WorkflowStepRunResult<any>[] = [];

      while (currentId) {
        const step = stepsById.get(currentId);
        if (!step) break;
        console.log('step', step);

        // 1. Step 실행
        const stepResult = await executeStep(step, context, this.executeBlock, tabId);
        console.log('stepResult', stepResult);

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

      return { steps: results, tabId, context };
    } finally {
      // 실행 상태 UI 숨김
      await this.statusController?.hide(tabId);
    }
  }
}
