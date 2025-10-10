import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectDataNewTabMessage,
  CollectWorkflowNewTabMessage,
  CdpClickMessage,
  CdpKeypressMessage,
  isCollectDataNewTabMessage,
  isCdpClickMessage,
  isCdpKeypressMessage,
  ErrorResponse,
  BackgroundStepResponse,
} from '@/types/internal-messages';
import { WorkflowRunner } from './WorkflowRunner';
import { AiParsingService } from './AiParsingService';

export class BackgroundManager {
  private aiParsingService: AiParsingService;

  constructor(private tabManager: TabManager) {
    this.aiParsingService = new AiParsingService();
  }

  initHandler() {
    // Chrome runtime message handler (internal communication)
    chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
      if ((message as any).type === 'COLLECT_DATA_NEW_TAB' && isCollectDataNewTabMessage(message)) {
        this.handleAsyncCollectData(message.data, sendResponse);
        return true;
      }

      if ((message as any).type === 'COLLECT_WORKFLOW_NEW_TAB') {
        this.handleAsyncCollectWorkflow((message as CollectWorkflowNewTabMessage).data, sendResponse);
        return true;
      }

      if ((message as any).type === 'CDP_CLICK' && isCdpClickMessage(message)) {
        // Get tabId from sender
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({ $isError: true, message: 'Tab ID not found in sender', data: null } as ErrorResponse);
          return false;
        }
        this.handleAsyncCdpClick({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if ((message as any).type === 'CDP_KEYPRESS' && isCdpKeypressMessage(message)) {
        // Get tabId from sender
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({ $isError: true, message: 'Tab ID not found in sender', data: null } as ErrorResponse);
          return false;
        }
        this.handleAsyncCdpKeypress({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if ((message as any).type === 'AI_PARSE_DATA') {
        this.handleAsyncAiParseData((message as any).data, sendResponse);
        return true;
      }

      sendResponse({ $isError: true, message: 'Invalid message type', data: {} } as ErrorResponse);
      return false;
    });
  }

  private async handleAsyncCollectData(
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

  private async handleAsyncCollectWorkflow(
    requestData: CollectWorkflowNewTabMessage['data'],
    sendResponse: (response: any) => void
  ) {
    // 1) 유효성 검증
    if (!requestData.targetUrl) {
      sendResponse({ $isError: true, message: 'Target URL is required for workflow', data: {} } as ErrorResponse);
      return;
    }
    if (!requestData.workflow) {
      sendResponse({ $isError: true, message: 'Workflow is required', data: {} } as ErrorResponse);
      return;
    }

    // 2) 탭 생성
    const tab = await this.tabManager.createTab(requestData.targetUrl, requestData.activateTab === true);
    if (tab.id === undefined) {
      sendResponse({ $isError: true, message: 'Failed to create tab or tab ID is missing', data: {} } as ErrorResponse);
      return;
    }

    try {
      // 3) 워크플로우 실행 (별도 러너 사용)
      const runner = new WorkflowRunner(this.tabManager);
      const result = await runner.run(requestData.workflow, tab.id!);
      sendResponse({ success: true, targetUrl: requestData.targetUrl, tabId: tab.id!, result, timestamp: new Date().toISOString(), closeTabAfterCollection: requestData.closeTabAfterCollection !== false });
    } catch (error: any) {
      sendResponse({ $isError: true, message: error.message, data: {} } as ErrorResponse);
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

  // CDP 클릭 요청 처리
  private async handleAsyncCdpClick(
    requestData: CdpClickMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    try {
      console.log('[8G Background] CDP Click request:', requestData);

      const { tabId, x, y } = requestData;

      // Debugger 연결
      await chrome.debugger.attach({ tabId }, '1.3');
      console.log('[8G Background] Debugger attached to tab:', tabId);

      try {
        // 1. Mouse move to position
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x,
          y,
          button: 'none',
          clickCount: 0,
        });

        // 2. Mouse down
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x,
          y,
          button: 'left',
          clickCount: 1,
        });

        // 3. Mouse up
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x,
          y,
          button: 'left',
          clickCount: 1,
        });

        console.log('[8G Background] CDP Click completed successfully');
        sendResponse({ success: true, data: { clicked: true } });
      } finally {
        // Debugger 연결 해제
        await chrome.debugger.detach({ tabId });
        console.log('[8G Background] Debugger detached from tab:', tabId);
      }
    } catch (error) {
      console.error('[8G Background] CDP Click error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP click failed',
        data: null,
      } as ErrorResponse);
    }
  }

  // CDP 키보드 입력 요청 처리
  private async handleAsyncCdpKeypress(
    requestData: CdpKeypressMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    try {
      console.log('[8G Background] CDP Keypress request:', requestData);

      const { tabId, key, code, keyCode, modifiers } = requestData;

      // Debugger 연결
      await chrome.debugger.attach({ tabId }, '1.3');
      console.log('[8G Background] Debugger attached to tab:', tabId);

      try {
        // Convert modifiers to CDP format
        const cdpModifiers = this.convertModifiersToCdp(modifiers);

        // 1. Key down
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
          type: 'keyDown',
          key,
          code,
          windowsVirtualKeyCode: keyCode,
          nativeVirtualKeyCode: keyCode,
          modifiers: cdpModifiers,
        });

        // 2. Key up
        await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
          type: 'keyUp',
          key,
          code,
          windowsVirtualKeyCode: keyCode,
          nativeVirtualKeyCode: keyCode,
          modifiers: cdpModifiers,
        });

        console.log('[8G Background] CDP Keypress completed successfully');
        sendResponse({ success: true, data: { pressed: true } });
      } finally {
        // Debugger 연결 해제
        await chrome.debugger.detach({ tabId });
        console.log('[8G Background] Debugger detached from tab:', tabId);
      }
    } catch (error) {
      console.error('[8G Background] CDP Keypress error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP keypress failed',
        data: null,
      } as ErrorResponse);
    }
  }

  // Convert modifier strings to CDP modifier bitmask
  private convertModifiersToCdp(modifiers: string[]): number {
    let mask = 0;
    if (modifiers.includes('Alt')) mask |= 1;
    if (modifiers.includes('Control')) mask |= 2;
    if (modifiers.includes('Meta')) mask |= 4;
    if (modifiers.includes('Shift')) mask |= 8;
    return mask;
  }

  // AI 파싱 요청 처리
  private async handleAsyncAiParseData(
    requestData: any,
    sendResponse: (response: any) => void
  ) {
    try {
      console.log('[8G Background] AI Parse Data request:', requestData);

      const result = await this.aiParsingService.parseData(requestData);

      if (result.success) {
        sendResponse({
          success: true,
          data: result.data,
        });
      } else {
        sendResponse({
          $isError: true,
          message: result.error || 'AI parsing failed',
          data: null,
        } as ErrorResponse);
      }
    } catch (error) {
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Unknown error in AI parsing',
        data: null,
      } as ErrorResponse);
    }
  }
}