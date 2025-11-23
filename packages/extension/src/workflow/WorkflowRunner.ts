import type { Workflow } from '@/sdk/types';
import { createExecutionContext, setVarsInContext, resolveBindings } from './context';
import type { BlockExecutor } from './step-executor';
import { executeWorkflowSegment } from './step-executor/subtree-executor';

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
      const { results, context: finalContext } = await executeWorkflowSegment({
        currentId: workflow.start,
        context,
        stepsById,
        tabId,
        executeBlock: this.executeBlock,
      });

      return { steps: results, tabId, context: finalContext };
    } finally {
      // 실행 상태 UI 숨김
      await this.statusController?.hide(tabId);
    }
  }
}
