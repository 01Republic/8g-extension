import type { Workflow, WorkflowStepRunResult } from '@/sdk/types';
import { createExecutionContext, setVarsInContext, resolveBindings, ExecutionContext } from './context';
import type { BlockExecutor } from './step-executor';
import { executeWorkflowSegment } from './step-executor/subtree-executor';
import { captureError } from '../utils/sentry';

export type TabCreator = (
  targetUrl: string,
  activateTab: boolean,
  originTabId?: number
) => Promise<number>;

export type StatusController = {
  show: (tabId: number, message?: string) => Promise<void>;
  hide: (tabId: number) => Promise<void>;
};

export class WorkflowRunner {
  constructor(
    private executeBlock: BlockExecutor,
    private createTab: TabCreator,
    private executeWithHooks: (tabId: number, run: () => Promise<{steps: WorkflowStepRunResult<any>[], tabId: number, context: ExecutionContext}>) => Promise<{steps: WorkflowStepRunResult<any>[], tabId: number, context: ExecutionContext}>,
    private statusController: StatusController,
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

    // 탭 생성 (UI는 TabManager.createTab 내부에서 즉시 표시됨)
    const tabId = await this.createTab(resolvedTargetUrl, activateTab, originTabId);

    try {
      const result = await this.executeWithHooks(tabId, async () => {
        const stepsById = new Map(workflow.steps.map((s) => [s.id, s]));
        const { results, context: finalContext } = await executeWorkflowSegment({
          currentId: workflow.start,
          context,
          stepsById,
          tabId,
          executeBlock: this.executeBlock,
        });

        return { steps: results, tabId, context: finalContext };
      });

      // 실패한 스텝 확인 및 Sentry 캡처
      const failedSteps = result.steps.filter((s) => !s.success && !s.skipped);
      console.log('[WorkflowRunner] Workflow completed. Failed steps:', failedSteps.length);
      if (failedSteps.length > 0) {
        const stepsById = new Map(workflow.steps.map((s) => [s.id, s]));
        const firstFailure = failedSteps[0];
        const firstFailureStep = stepsById.get(firstFailure.stepId);

        console.log('[WorkflowRunner] Capturing error to Sentry:', firstFailure.stepId, firstFailure.message);
        captureError(new Error(`Workflow failed: ${firstFailure.message}`), {
          // 워크플로우 정보
          workflowId: workflow.id,
          workflowTitle: workflow.title,
          workflowVersion: workflow.version,
          targetUrl: resolvedTargetUrl,
          workflowStart: workflow.start,
          stepCount: workflow.steps.length,

          // 첫 번째 실패 스텝 상세
          failedStepId: firstFailure.stepId,
          failedStepTitle: firstFailureStep?.title,
          failedStepMessage: firstFailure.message,
          failedBlockType: firstFailureStep?.block?.name,
          failedBlockSelector: firstFailureStep?.block?.selector,
          failedBlockFindBy: firstFailureStep?.block?.findBy,

          // 전체 실패 요약
          totalFailures: failedSteps.length,
          failedSteps: failedSteps.map((s) => {
            const stepDef = stepsById.get(s.stepId);
            return {
              stepId: s.stepId,
              stepTitle: stepDef?.title,
              message: s.message,
              blockType: stepDef?.block?.name,
              selector: stepDef?.block?.selector,
            };
          }),
        });
        console.log('[WorkflowRunner] Error captured to Sentry');
      }

      return result;
    } finally {
      // 워크플로우 완료 후 UI 숨김
      await this.statusController.hide(tabId);
    }
  }

}
