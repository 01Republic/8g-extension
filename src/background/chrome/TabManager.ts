import { Block, BlockResult } from '@/blocks';
import {
  ExecuteBlockMessage,
  BlockExecutionResponse,
  isErrorResponse,
} from '@/types/internal-messages';

export class TabManager {
  private activeTabs: Map<number, { url: string; createdAt: number }> = new Map();
  private closedTabs: Set<number> = new Set();

  constructor() {
    this.initializeTabClosedListener();
  }

  // 탭 닫힘 이벤트 리스너 초기화
  private initializeTabClosedListener() {
    chrome.tabs.onRemoved.addListener((tabId) => {
      console.log('[TabManager] Tab closed:', tabId);

      if (this.activeTabs.has(tabId)) {
        console.log('[TabManager] Tracked tab was closed:', tabId);
        this.activeTabs.delete(tabId);
        this.closedTabs.add(tabId);

        // 메모리 누수 방지를 위해 1분 후 제거
        setTimeout(() => {
          this.closedTabs.delete(tabId);
        }, 60000);
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
    contentScriptDelay: number = 2000
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

    // 탭이 로드될 때까지 대기
    await this.waitForTabLoad(tab.id!);

    // content script 로드 및 DOM 준비 대기
    await new Promise((resolve) => setTimeout(resolve, contentScriptDelay));

    return tab;
  }

  async closeTab(tabId: number): Promise<void> {
    await chrome.tabs.remove(tabId);
    this.activeTabs.delete(tabId);
  }

  async waitForTabLoad(tabId: number, timeout: number = 30000): Promise<void> {
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

    return new Promise((resolve, reject) => {
      const message: ExecuteBlockMessage = {
        isBlock: true,
        type: 'EXECUTE_BLOCK',
        data: blockData,
      };

      chrome.tabs.sendMessage(tabId, message, (response: BlockExecutionResponse) => {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);

          // 탭 닫힘으로 인한 에러인지 확인
          if (this.isTabClosed(tabId)) {
            reject(new Error('Tab was closed by user'));
          } else {
            reject(new Error(chrome.runtime.lastError.message || 'Communication error'));
          }
        } else if (isErrorResponse(response)) {
          console.log('Content script error:', response.message);
          reject(new Error(response.message));
        } else {
          console.log('Received response from content script:', response);
          resolve(response || { data: null });
        }
      });
    });
  }
}
