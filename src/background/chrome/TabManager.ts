import { Block, BlockResult } from '@/blocks';
import {
  ExecuteBlockMessage,
  BlockExecutionResponse,
  isErrorResponse,
  ShowExecutionStatusMessage,
  HideExecutionStatusMessage,
} from '@/types/internal-messages';
import { CdpService, NetworkRequest } from '../service/CdpService';

export class TabManager {
  private activeTabs: Map<number, { url: string; createdAt: number }> = new Map();
  private closedTabs: Set<number> = new Set();
  private executingWorkflowTabs: Map<number, { message: string }> = new Map();
  private cdpService: CdpService;

  constructor(cdpService: CdpService) {
    this.cdpService = cdpService;
    this.initializeTabClosedListener();
    this.initializeTabUpdatedListener();
  }

  // 탭 닫힘 이벤트 리스너 초기화
  private initializeTabClosedListener() {
    chrome.tabs.onRemoved.addListener(async (tabId) => {
      console.log('[TabManager] Tab closed:', tabId);

      if (this.activeTabs.has(tabId)) {
        console.log('[TabManager] Tracked tab was closed:', tabId);

        // 네트워크 추적 중지
        try {
          await this.cdpService.stopNetworkTracking(tabId);
          console.log('[TabManager] Network tracking stopped for closed tab:', tabId);
        } catch (error) {
          console.warn('[TabManager] Failed to stop network tracking:', error);
        }

        // 네트워크 데이터 정리
        this.cdpService.clearNetworkRequests(tabId);

        this.activeTabs.delete(tabId);
        this.closedTabs.add(tabId);
        this.executingWorkflowTabs.delete(tabId);

        // 메모리 누수 방지를 위해 1분 후 제거
        setTimeout(() => {
          this.closedTabs.delete(tabId);
        }, 60000);
      }
    });
  }

  // 탭 업데이트(페이지 로드) 이벤트 리스너 초기화
  private initializeTabUpdatedListener() {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      // 페이지 로드가 완료되고, 워크플로우 실행 중인 탭이면 UI 재표시
      if (changeInfo.status === 'complete' && this.executingWorkflowTabs.has(tabId)) {
        const workflowInfo = this.executingWorkflowTabs.get(tabId);
        if (workflowInfo) {
          console.log('[TabManager] Page loaded in executing workflow tab, re-showing UI:', tabId);
          // 짧은 딜레이 후 UI 재표시 (content script 준비 대기)
          setTimeout(async () => {
            await this.showExecutionStatus(tabId, workflowInfo.message);
          }, 500);
        }
      }
    });
  }

  // 탭이 닫혔는지 확인
  isTabClosed(tabId: number): boolean {
    return this.closedTabs.has(tabId);
  }

  async createTab(
    url: string,
    activate: boolean = false,
    contentScriptDelay: number = 2000,
    enableNetworkTracking: boolean = true
  ): Promise<chrome.tabs.Tab> {
    const tab = await chrome.tabs.create({
      url,
      active: activate,
    });

    if (!tab.id) {
      throw new Error('Failed to create new tab');
    }

    this.activeTabs.set(tab.id, {
      url,
      createdAt: Date.now(),
    });

    // 네트워크 추적 시작 (옵션)
    if (enableNetworkTracking) {
      try {
        await this.cdpService.startNetworkTracking(tab.id);
        console.log('[TabManager] Network tracking started for tab:', tab.id);
      } catch (error) {
        console.warn('[TabManager] Failed to start network tracking:', error);
        // 네트워크 추적 실패해도 계속 진행
      }
    }

    // 탭이 로드될 때까지 대기
    await this.waitForTabLoad(tab.id!);

    // content script 로드 및 DOM 준비 대기
    await new Promise((resolve) => setTimeout(resolve, contentScriptDelay));

    return tab;
  }

  async closeTab(tabId: number): Promise<void> {
    // 네트워크 추적 중지
    try {
      await this.cdpService.stopNetworkTracking(tabId);
      console.log('[TabManager] Network tracking stopped before closing tab:', tabId);
    } catch (error) {
      console.warn('[TabManager] Failed to stop network tracking:', error);
    }

    // 네트워크 데이터 정리
    this.cdpService.clearNetworkRequests(tabId);

    await chrome.tabs.remove(tabId);
    this.activeTabs.delete(tabId);
  }

  async waitForTabLoad(tabId: number, timeout: number = 100000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Tab load timeout'));
      }, timeout);

      const listener = (updatedTabId: number, changeInfo: any) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          clearTimeout(timeoutId);
          chrome.tabs.onUpdated.removeListener(listener);
          console.log('[8G TabManager] Tab loaded successfully:', tabId);
          resolve();
        }
      };

      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  async showExecutionStatus(tabId: number, message?: string): Promise<void> {
    if (this.isTabClosed(tabId)) {
      console.log('[TabManager] Cannot show execution status - tab was closed:', tabId);
      return;
    }

    const displayMessage = message || '워크플로우 실행 중';

    // 워크플로우 실행 중 상태 저장
    this.executingWorkflowTabs.set(tabId, { message: displayMessage });

    const statusMessage: ShowExecutionStatusMessage = {
      type: 'SHOW_EXECUTION_STATUS',
      data: { message: displayMessage },
    };

    try {
      await chrome.tabs.sendMessage(tabId, statusMessage);
      console.log('[TabManager] Execution status shown');
    } catch (error) {
      console.warn('[TabManager] Failed to show execution status:', error);
    }
  }

  async hideExecutionStatus(tabId: number): Promise<void> {
    if (this.isTabClosed(tabId)) {
      console.log('[TabManager] Cannot hide execution status - tab was closed:', tabId);
      return;
    }

    // 워크플로우 실행 완료 - 상태 제거
    this.executingWorkflowTabs.delete(tabId);

    const statusMessage: HideExecutionStatusMessage = {
      type: 'HIDE_EXECUTION_STATUS',
    };

    try {
      await chrome.tabs.sendMessage(tabId, statusMessage);
      console.log('[TabManager] Execution status hidden');
    } catch (error) {
      console.warn('[TabManager] Failed to hide execution status:', error);
    }
  }

  async executeBlock(blockData: Block, tabId: number): Promise<BlockResult> {
    // 메시지 전송 전 탭 닫힘 확인
    if (this.isTabClosed(tabId)) {
      console.log('[TabManager] Cannot execute block - tab was closed:', tabId);
      return {
        hasError: true,
        message: 'Tab was closed by user',
        data: null,
      };
    }

    return this.executeBlockWithRetry(blockData, tabId, 0);
  }

  private async executeBlockWithRetry(
    blockData: Block,
    tabId: number,
    retryCount: number
  ): Promise<BlockResult> {
    const MAX_RETRIES = 3;

    return new Promise((resolve, reject) => {
      const message: ExecuteBlockMessage = {
        isBlock: true,
        type: 'EXECUTE_BLOCK',
        data: blockData,
      };

      chrome.tabs.sendMessage(tabId, message, async (response: BlockExecutionResponse) => {
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message || '';
          console.log('[TabManager] Error sending message:', errorMsg);

          // 탭 닫힘으로 인한 에러인지 확인
          if (this.isTabClosed(tabId)) {
            reject(new Error('Tab was closed by user'));
            return;
          }

          // 페이지 전환으로 인한 content script unload 감지
          const isPageTransition =
            errorMsg.includes('Receiving end does not exist') ||
            errorMsg.includes('message channel closed') ||
            errorMsg.includes('back/forward cache');

          if (isPageTransition && retryCount < MAX_RETRIES) {
            console.log(
              `[TabManager] Page transition detected, waiting for reload and retrying (${retryCount + 1}/${MAX_RETRIES})...`
            );

            try {
              // 페이지 로드 대기
              await this.waitForTabLoad(tabId, 10000);
              // Content script 준비 대기
              await new Promise((r) => setTimeout(r, 1000));

              // 재시도
              const result = await this.executeBlockWithRetry(blockData, tabId, retryCount + 1);
              resolve(result);
            } catch (error) {
              reject(new Error('Page load timeout after transition'));
            }
          } else {
            reject(new Error(errorMsg || 'Communication error'));
          }
        } else if (isErrorResponse(response)) {
          console.log('[TabManager] Content script error:', response.message);
          reject(new Error(response.message));
        } else {
          console.log('[TabManager] Received response from content script');
          resolve(response || { data: null });
        }
      });
    });
  }

  /**
   * 특정 탭의 네트워크 요청 데이터를 가져옵니다.
   *
   * @param tabId - 탭 ID
   * @returns 네트워크 요청 배열
   */
  getNetworkRequests(tabId: number): NetworkRequest[] {
    return this.cdpService.getNetworkRequests(tabId);
  }

  /**
   * 특정 탭의 네트워크 추적을 시작합니다.
   *
   * @param tabId - 탭 ID
   */
  async startNetworkTracking(tabId: number): Promise<void> {
    await this.cdpService.startNetworkTracking(tabId);
  }

  /**
   * 특정 탭의 네트워크 추적을 중지합니다.
   *
   * @param tabId - 탭 ID
   */
  async stopNetworkTracking(tabId: number): Promise<void> {
    await this.cdpService.stopNetworkTracking(tabId);
  }
}
