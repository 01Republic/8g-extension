import { Block } from '@/blocks';
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
    const executeBlock = (block: Block, tabId: number) => this.tabManager.executeBlock(block, tabId);
    const createTab = async (targetUrl: string, activateTab: boolean) => {
      const tab = await this.tabManager.createTab(targetUrl, activateTab);
      if (tab.id === undefined) {
        throw new Error('Failed to create tab or tab ID is missing');
      }
      return tab.id;
    };

    this.workflowRunner = new WorkflowRunner(
      executeBlock,
      createTab
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

    let tabId: number | undefined;

    try {
      // 2) 워크플로우 실행 (내부에서 탭 생성)
      console.log('[WorkflowService] Running workflow for:', requestData.targetUrl);
      const result = await this.workflowRunner.run(
        requestData.workflow,
        requestData.targetUrl,
        requestData.activateTab === true
      );

      tabId = result.tabId;

      // 3) 성공 응답 전송
      sendResponse({
        success: true,
        targetUrl: requestData.targetUrl,
        tabId: result.tabId,
        result: { steps: result.steps },
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
      // 4) 정리 작업 (탭 닫기)
      if (tabId !== undefined && requestData.closeTabAfterCollection !== false) {
        await this.cleanup(tabId);
      }
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

