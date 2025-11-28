import { Block } from '@/blocks';
import { TabManager } from '../chrome/TabManager';
import { CollectWorkflowNewTabMessage, ErrorResponse } from '@/types/internal-messages';
import { ExecutionContext, WorkflowRunner } from '@/workflow';
import { WorkflowStepRunResult } from '@/sdk/types';

export type ExecutionStatusController = {
  show: (tabId: number, message?: string) => Promise<void>;
  hide: (tabId: number) => Promise<void>;
};




/**
 * Workflow Service
 *
 * 워크플로우 실행을 처리하는 서비스입니다.
 */
export class WorkflowService {
  private workflowRunner: WorkflowRunner;
  private statusController!: ExecutionStatusController;

  constructor(private tabManager: TabManager) {
    // TabManager의 executeBlock 메서드를 executor 함수로 주입
    const executeBlock = (block: Block, tabId: number) =>
      this.tabManager.executeBlock(block, tabId);
    const createTab = async (targetUrl: string, activateTab: boolean, originTabId?: number) => {
      const tab = await this.tabManager.createTab(
        targetUrl,
        activateTab,
        undefined,
        undefined,
        originTabId
      );
      if (tab.id === undefined) {
        throw new Error('Failed to create tab or tab ID is missing');
      }
      return tab.id;
    };

    // ExecutionStatus UI 컨트롤러
    this.statusController = {
      show: (tabId: number, message?: string) =>
        this.tabManager.showExecutionStatus(tabId, message),
      hide: (tabId: number) => this.tabManager.hideExecutionStatus(tabId),
    };

    const executeWithHooks = async (
      tabId: number, 
      run: () => Promise<{steps: WorkflowStepRunResult<any>[], tabId: number, context: ExecutionContext}>
    ) => {
      try {
        // 일반 워크플로우는 ExecutionStatus UI 사용
        await this.statusController.show(tabId, '워크플로우 실행 중');
        const result = await run();
        return result;
      } finally {
        await this.statusController.hide(tabId);
      }
    };
    this.workflowRunner = new WorkflowRunner(executeBlock, createTab, executeWithHooks);
  }
  /**
   * 워크플로우 실행 요청을 처리하고 응답을 전송합니다.
   *
   * @param requestData - 워크플로우 실행 요청 데이터
   * @param sendResponse - 응답 전송 함수
   */
  async handleCollectWorkflow(
    requestData: CollectWorkflowNewTabMessage['data'],
    sendResponse: (response: any) => void
  ): Promise<void> {
    // 1) 유효성 검증
    const validationResult = this.validateRequest(requestData);
    if (!validationResult.success) {
      sendResponse({
        $isError: true,
        message: validationResult.error,
        data: {},
      } as ErrorResponse);
      return;
    }

    let tabId: number | undefined;

    try {
      // 2) 워크플로우 실행 (내부에서 탭 생성)
      console.log('[WorkflowService] Running workflow for:', requestData.targetUrl);
      const result = await this.workflowRunner.run(
        requestData.workflow,
        requestData.targetUrl,
        requestData.activateTab === true,
        requestData.originTabId
      );

      tabId = result.tabId;

      // 3) 성공 응답 전송 (context를 플레인 객체로 변환)
      const plainContext = {
        steps: result.context.stepContext.steps,
        vars: result.context.varContext.vars,
        forEach: result.context.loopContext.forEach,
        loop: result.context.loopContext.loop,
      };

      sendResponse({
        success: true,
        targetUrl: requestData.targetUrl,
        tabId: result.tabId,
        result: { steps: result.steps, context: plainContext },
        timestamp: new Date().toISOString(),
        closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
      });
      
      // 정리 작업 (탭 닫기) - 명시적으로 false인 경우에만 탭을 유지
      const shouldCloseTab = requestData.closeTabAfterCollection !== false;
      if (tabId !== undefined && shouldCloseTab) {
        await this.cleanup(tabId);
      }
    } catch (error) {
      console.error('[WorkflowService] Workflow execution error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Workflow execution failed',
        data: {},
      } as ErrorResponse);
    }
  }

  /**
   * 워크플로우 요청 데이터의 유효성을 검증합니다.
   *
   * @param requestData - 워크플로우 실행 요청 데이터
   * @returns 유효성 검증 결과
   */
  private validateRequest(requestData: CollectWorkflowNewTabMessage['data']): {
    success: boolean;
    error?: string;
  } {
    if (!requestData.targetUrl) {
      return {
        success: false,
        error: 'Target URL is required for workflow',
      };
    }

    if (!requestData.workflow) {
      return {
        success: false,
        error: 'Workflow is required',
      };
    }

    return { success: true };
  }

  /**
   * 정리 작업을 수행합니다 (탭 닫기).
   *
   * @param tabId - 닫을 탭 ID
   */
  private async cleanup(tabId: number): Promise<void> {
    console.log('[WorkflowService] Cleanup - closing tab:', tabId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.tabManager.closeTab(tabId);
  }

}
