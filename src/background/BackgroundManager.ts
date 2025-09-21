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
    // Chrome runtime message handler (internal communication)
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
  ): Promise<BackgroundStepResponse<any>> {
    console.log('[8G Background] Step 3: Executing block(s) in tab:', tab.id);

    // 단일 블록인지 배열인지 확인
    if (Array.isArray(requestData.block)) {
      // 여러 블록 순차 실행 (설정 가능한 지연 시간)
      const blockDelay = requestData.blockDelay || 500; // 기본값 500ms
      const blockResults = await this.stepExecuteBlockList(requestData.block, tab.id!, blockDelay);
      console.log('[8G Background] Block list execution results:', blockResults);

      return {
        success: true,
        targetUrl: requestData.targetUrl,
        tabId: tab.id!,
        result: blockResults,
        timestamp: new Date().toISOString(),
        closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
      };
    } else {
      // 단일 블록 실행
      const blockResult = await this.tabManager.executeBlock(requestData.block, tab.id!);
      console.log('[8G Background] Single block execution result:', blockResult);

      return {
        success: true,
        targetUrl: requestData.targetUrl,
        tabId: tab.id!,
        result: blockResult,
        timestamp: new Date().toISOString(),
        closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
      };
    }
  }

  // 블록 배열을 순차적으로 실행
  private async stepExecuteBlockList(
    blocks: any[],
    tabId: number,
    blockDelay: number = 500 // 기본 500ms, 설정 가능
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      console.log(`[8G Background] Executing block ${i + 1}/${blocks.length}:`, block.name);
      
      try {
        const result = await this.tabManager.executeBlock(block, tabId);
        results.push(result);
        
        // 블록 실행 후 대기 (DOM 업데이트 등) - 설정 가능한 지연 시간
        if (i < blocks.length - 1 && blockDelay > 0) {
          console.log(`[8G Background] Waiting ${blockDelay}ms before next block...`);
          await new Promise(resolve => setTimeout(resolve, blockDelay));
        }
        
        // 에러 발생 시 중단할지 결정 (현재는 계속 진행)
        if (result.hasError) {
          console.warn(`[8G Background] Block ${i + 1} failed but continuing:`, result.message);
        }
      } catch (error) {
        console.error(`[8G Background] Block ${i + 1} execution error:`, error);
        results.push({
          hasError: true,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: null,
        });
      }
    }
    
    return results;
  }

  // Step 4: 정리 작업
  private async stepCleanup(tabId: number): Promise<void> {
    console.log('[8G Background] Step 4: Cleanup and finalize');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.tabManager.closeTab(tabId);
  }
}
