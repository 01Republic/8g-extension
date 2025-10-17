import { Block, BlockResult } from '@/blocks';
import {
  ExecuteBlockMessage,
  BlockExecutionResponse,
  isErrorResponse,
} from '@/types/internal-messages';

export class TabManager {
  private activeTabs: Map<number, { url: string; createdAt: number }> = new Map();

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
    return new Promise((resolve, reject) => {
      const message: ExecuteBlockMessage = {
        isBlock: true,
        type: 'EXECUTE_BLOCK',
        data: blockData,
      };

      chrome.tabs.sendMessage(tabId, message, (response: BlockExecutionResponse) => {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message || 'Communication error'));
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
