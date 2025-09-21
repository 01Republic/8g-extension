import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectDataNewTabMessage,
  isCollectDataNewTabMessage,
  ErrorResponse,
  BackgroundStepResponse,
} from '@/types/internal-messages';

export class BackgroundManager {
  constructor(private tabManager: TabManager) {}

  initHandler() {
    chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
      if (!isCollectDataNewTabMessage(message)) {
        sendResponse({
          $isError: true,
          message: 'Invalid message type',
          data: {},
        } as ErrorResponse);
        return false;
      }

      // async 함수를 별도로 실행
      this.handleAsyncMessage(message.data, sendResponse);
      return true;
    });
  }

  private async handleAsyncMessage(
    requestData: CollectDataNewTabMessage['data'],
    sendResponse: (response: any) => void
  ) {
    const validationResult = await this.stepValidateRequest(requestData);
    if (!validationResult.success) {
      sendResponse({
        $isError: true,
        message: validationResult.error,
        data: {},
      } as ErrorResponse);
      return;
    }

    const tab = await this.stepCreateTab(requestData);
    if (tab.id === undefined) {
      sendResponse({
        $isError: true,
        message: 'Failed to create tab or tab ID is missing',
        data: {},
      } as ErrorResponse);
      return;
    }

    try {
      const blockExecutionResult = await this.stepExecuteBlock(requestData, tab);
      sendResponse(blockExecutionResult);
    } catch (error: any) {
      sendResponse({
        $isError: true,
        message: error.message,
        data: {},
      } as ErrorResponse);
    } finally {
      await this.stepCleanup(tab.id);
    }
  }

  // Step 1: 요청 데이터 유효성 검증
  // 필수 필드들(targetUrl, block)이 존재하는지 확인
  private async stepValidateRequest(
    requestData: CollectDataNewTabMessage['data']
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[8G Background] Step 1: Validating request data');

    if (!requestData.targetUrl) {
      return { success: false, error: 'Target URL is required for new tab collection' };
    }

    if (!requestData.block) {
      return { success: false, error: 'Block is required' };
    }

    return { success: true };
  }

  // Step 2: 새 탭 생성 및 로딩 완료 대기
  // 지정된 URL로 탭을 생성하고 페이지 로딩과 content script 준비까지 대기
  private async stepCreateTab(
    requestData: CollectDataNewTabMessage['data']
  ): Promise<chrome.tabs.Tab> {
    console.log('[8G Background] Step 2: Creating tab for:', requestData.targetUrl);

    return await this.tabManager.createTab(requestData.targetUrl, requestData.activateTab === true);
  }

  // Step 3: 블록 실행 및 응답 데이터 구성
  // content script에 블록을 전송하여 실행하고, 결과를 포함한 응답 객체 생성
  private async stepExecuteBlock(
    requestData: CollectDataNewTabMessage['data'],
    tab: chrome.tabs.Tab
  ): Promise<BackgroundStepResponse> {
    console.log('[8G Background] Step 3: Executing block in tab:', tab.id);

    const blockResult = await this.tabManager.executeBlock(requestData.block, tab.id!!);
    console.log('[8G Background] Block execution result:', blockResult);

    return {
      success: true,
      targetUrl: requestData.targetUrl,
      tabId: tab.id!!,
      result: blockResult,
      timestamp: new Date().toISOString(),
      closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
    };
  }

  // Step 4: 정리 작업
  private async stepCleanup(tabId: number): Promise<void> {
    console.log('[8G Background] Step 4: Cleanup and finalize');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.tabManager.closeTab(tabId);
  }
}
