import { TabManager } from '../chrome/TabManager';
import { CollectWorkflowNewTabMessage, ErrorResponse } from '@/types/internal-messages';
import { WorkflowRunner } from '@/workflow';

/**
 * Workflow Service
 * 
 * 워크플로우 실행을 처리하는 서비스입니다.
 */
export class WorkflowService {
  private workflowRunner: WorkflowRunner;

  constructor(private tabManager: TabManager) {
    // TabManager의 executeBlock 메서드를 executor 함수로 주입
    this.workflowRunner = new WorkflowRunner((block, tabId) =>
      this.tabManager.executeBlock(block, tabId)
    );
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

    // 2) 탭 생성
    const tab = await this.tabManager.createTab(
      requestData.targetUrl,
      requestData.activateTab === true
    );

    if (tab.id === undefined) {
      sendResponse({
        $isError: true,
        message: 'Failed to create tab or tab ID is missing',
        data: {},
      } as ErrorResponse);
      return;
    }

    try {
      // 3) 워크플로우 실행
      console.log('[WorkflowService] Running workflow in tab:', tab.id);
      const result = await this.workflowRunner.run(requestData.workflow, tab.id);

      // 4) 성공 응답 전송
      sendResponse({
        success: true,
        targetUrl: requestData.targetUrl,
        tabId: tab.id,
        result,
        timestamp: new Date().toISOString(),
        closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
      });
    } catch (error) {
      console.error('[WorkflowService] Workflow execution error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Workflow execution failed',
        data: {},
      } as ErrorResponse);
    } finally {
      // 5) 정리 작업 (탭 닫기)
      await this.cleanup(tab.id);
    }
  }

  /**
   * 워크플로우 요청 데이터의 유효성을 검증합니다.
   * 
   * @param requestData - 워크플로우 실행 요청 데이터
   * @returns 유효성 검증 결과
   */
  private validateRequest(
    requestData: CollectWorkflowNewTabMessage['data']
  ): { success: boolean; error?: string } {
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

