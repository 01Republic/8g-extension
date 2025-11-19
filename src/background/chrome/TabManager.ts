import { Block, BlockResult } from '@/blocks';
import {
  ExecuteBlockMessage,
  BlockExecutionResponse,
  isErrorResponse,
  ShowExecutionStatusMessage,
  HideExecutionStatusMessage,
  ShowConfirmationMessage,
} from '@/types/internal-messages';
import { CdpService, NetworkRequest } from '../service/CdpService';

export class TabManager {
  private activeTabs: Map<number, { url: string; createdAt: number }> = new Map();
  private closedTabs: Set<number> = new Set();
  private executingWorkflowTabs: Map<number, { message: string }> = new Map();
  private cdpService: CdpService;
  private tabOrigins: Map<number, number> = new Map();
  // 워크플로우 실행 중인 탭에서 열린 새 탭 추적 (Map<childTabId, parentTabId>)
  private trackedChildTabs: Map<number, number> = new Map();

  constructor(cdpService: CdpService) {
    this.cdpService = cdpService;
    this.initializeTabClosedListener();
    this.initializeTabUpdatedListener();
    this.initializeTabCreatedListener();
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

        try {
          await this.cdpService.detachDebugger(tabId);
          console.log('[TabManager] Debugger detached for closed tab:', tabId);
        } catch (error) {
          console.warn('[TabManager] Failed to detach debugger:', error);
        }

        // 네트워크 데이터 정리
        this.cdpService.clearNetworkRequests(tabId);

      this.activeTabs.delete(tabId);
      this.closedTabs.add(tabId);
      this.executingWorkflowTabs.delete(tabId);
      this.trackedChildTabs.delete(tabId);

      // 메모리 누수 방지를 위해 1분 후 제거
      setTimeout(() => {
        this.closedTabs.delete(tabId);
      }, 60000);
    }

    // 추적 중인 자식 탭이 닫혔는지 확인
    if (this.trackedChildTabs.has(tabId)) {
      this.trackedChildTabs.delete(tabId);
    }

    await this.focusParentTab(tabId);
  });
  }

  // 탭 업데이트(페이지 로드) 이벤트 리스너 초기화
  private initializeTabUpdatedListener() {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      // 페이지 로드가 완료되고, 워크플로우 실행 중인 탭이면 UI 재표시
      // 단, 추적 중인 자식 탭이 아닌 경우만 (자식 탭은 아래에서 별도 처리)
      if (
        changeInfo.status === 'complete' &&
        this.executingWorkflowTabs.has(tabId) &&
        !this.trackedChildTabs.has(tabId)
      ) {
        const workflowInfo = this.executingWorkflowTabs.get(tabId);
        if (workflowInfo) {
          console.log('[TabManager] Page loaded in executing workflow tab, re-showing UI:', tabId);
          // 짧은 딜레이 후 UI 재표시 (content script 준비 대기)
          setTimeout(async () => {
            await this.showExecutionStatus(tabId, workflowInfo.message);
          }, 500);
        }
      }

      // 추적 중인 새 탭이 로드 완료되면 Execution Status와 ConfirmationUI 표시
      if (changeInfo.status === 'complete' && this.trackedChildTabs.has(tabId)) {
        const parentTabId = this.trackedChildTabs.get(tabId);
        if (parentTabId) {
          console.log(
            `[TabManager] Tracked child tab loaded, showing execution status and confirmation UI. Child: ${tabId}, Parent: ${parentTabId}`
          );
          
          // 부모 탭의 execution status 정보 가져오기
          const parentWorkflowInfo = this.executingWorkflowTabs.get(parentTabId);
          const executionMessage = parentWorkflowInfo?.message || '워크플로우 실행 중';
          
          // 짧은 딜레이 후 Execution Status와 ConfirmationUI 표시 (content script 준비 대기)
          setTimeout(async () => {
            // Execution Status 표시 (부모와 동일한 메시지, 하지만 executingWorkflowTabs에는 등록하지 않음)
            await this.showExecutionStatus(tabId, executionMessage, false);
            
            // ConfirmationUI 표시 (상단에 표시)
            await this.showConfirmation(tabId, parentTabId, undefined, undefined, 'top');
          }, 1000);
        }
      }
    });
  }

  // 새 탭 생성 이벤트 리스너 초기화
  private initializeTabCreatedListener() {
    chrome.tabs.onCreated.addListener(async (tab) => {
      if (!tab.id) return;

      // 같은 윈도우에서 워크플로우 실행 중인 탭 찾기
      // window.open()으로 새 탭이 열리면 새 탭이 즉시 활성화될 수 있으므로,
      // 같은 윈도우의 모든 탭을 확인하여 워크플로우 실행 중인 탭을 찾음
      const allTabs = await chrome.tabs.query({ windowId: tab.windowId });
      
      // 워크플로우 실행 중인 탭 찾기 (활성 순서 상관없이)
      let parentTabId: number | undefined;
      for (const t of allTabs) {
        if (t.id && t.id !== tab.id && this.executingWorkflowTabs.has(t.id)) {
          parentTabId = t.id;
          // 새 탭이 아닌 탭 중 워크플로우 실행 중인 첫 번째 탭을 부모로 가정
          // (일반적으로 window.open()이 실행된 탭)
          break;
        }
      }

      // 부모 탭을 찾았으면 추적 시작
      if (parentTabId) {
        console.log(
          `[TabManager] New tab created from executing workflow tab. Child: ${tab.id}, Parent: ${parentTabId}`
        );
        this.trackedChildTabs.set(tab.id, parentTabId);
        this.tabOrigins.set(tab.id, parentTabId);

        // 새 탭도 추적 대상에 추가 (CDP 연결 시도)
        try {
          await this.cdpService.attachDebugger(tab.id);
          await this.cdpService.startNetworkTracking(tab.id);
          this.activeTabs.set(tab.id, {
            url: tab.url || '',
            createdAt: Date.now(),
          });
          console.log('[TabManager] Debugger attached for new child tab:', tab.id);
        } catch (error) {
          console.warn('[TabManager] Failed to attach debugger to new child tab:', error);
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
    enableNetworkTracking: boolean = true,
    originTabId?: number
  ): Promise<chrome.tabs.Tab> {
    const tab = await chrome.tabs.create({
      url,
      active: activate,
    });

    if (!tab.id) {
      throw new Error('Failed to create new tab');
    }

    try {
      await this.cdpService.attachDebugger(tab.id);
      console.log('[TabManager] Debugger attached for tab:', tab.id);
    } catch (error) {
      await chrome.tabs.remove(tab.id);
      throw error;
    }

    this.activeTabs.set(tab.id, {
      url,
      createdAt: Date.now(),
    });

    if (originTabId !== undefined && originTabId !== tab.id) {
      this.tabOrigins.set(tab.id, originTabId);
    }

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
    await this.closeTabWithoutFocus(tabId);
    await this.focusParentTab(tabId);
  }

  async closeTabWithoutFocus(tabId: number): Promise<void> {
    // 네트워크 추적 중지
    try {
      await this.cdpService.stopNetworkTracking(tabId);
      console.log('[TabManager] Network tracking stopped before closing tab:', tabId);
    } catch (error) {
      console.warn('[TabManager] Failed to stop network tracking:', error);
    }

    try {
      await this.cdpService.detachDebugger(tabId);
      console.log('[TabManager] Debugger detached before closing tab:', tabId);
    } catch (error) {
      console.warn('[TabManager] Failed to detach debugger before closing tab:', error);
    }

    // 네트워크 데이터 정리
    this.cdpService.clearNetworkRequests(tabId);

    await chrome.tabs.remove(tabId);
    this.activeTabs.delete(tabId);
    
    // 탭 관계 정리
    const visited = new Set<number>();
    let currentTabId: number | undefined = tabId;
    while (currentTabId) {
      if (visited.has(currentTabId)) break;
      visited.add(currentTabId);
      
      const nextTabId = this.tabOrigins.get(currentTabId);
      this.tabOrigins.delete(currentTabId);
      this.trackedChildTabs.delete(currentTabId);
      currentTabId = nextTabId;
    }
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

  async showExecutionStatus(
    tabId: number,
    message?: string,
    registerAsExecuting: boolean = true,
    statusType?: 'loading' | 'success' | 'error',
    icon?: 'login' | 'download' | 'mail' | 'default',
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  ): Promise<void> {
    if (this.isTabClosed(tabId)) {
      console.log('[TabManager] Cannot show execution status - tab was closed:', tabId);
      return;
    }

    const displayMessage = message || '워크플로우 실행 중';

    // 워크플로우 실행 중 상태 저장 (단, 자식 탭은 등록하지 않음)
    if (registerAsExecuting) {
      this.executingWorkflowTabs.set(tabId, { message: displayMessage });
    }

    const statusMessage: ShowExecutionStatusMessage = {
      type: 'SHOW_EXECUTION_STATUS',
      data: {
        message: displayMessage,
        statusType: statusType || 'loading',
        icon: icon || 'default',
        position: position || 'bottom-right',
      },
    };

    try {
      await chrome.tabs.sendMessage(tabId, statusMessage);
      
      // 워크플로우 실행 시작 시 초록색 ConfirmationUI도 함께 표시
      if (registerAsExecuting) {
        await this.showConfirmation(
          tabId,
          undefined, // parentTabId 없음 (워크플로우 실행 중인 메인 탭)
          '데이터를 수집하고 있습니다. 잠시만 기다려 주세요.',
          undefined, // buttonText 없음 (단순 정보 표시)
          'top',
          'success',
          'shield',
          false // showClose false (워크플로우 실행 중에는 닫을 수 없음)
        );
      }
      
      console.log('[TabManager] Execution status shown', {
        tabId,
        registerAsExecuting,
        statusType,
        icon,
        position,
      });
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

  async showConfirmation(
    tabId: number,
    parentTabId: number | undefined,
    message?: string,
    buttonText?: string,
    position?: 'top' | 'bottom',
    variant?: 'default' | 'warning' | 'info' | 'success',
    icon?: 'shield' | 'click' | 'alert',
    showClose?: boolean
  ): Promise<void> {
    if (this.isTabClosed(tabId)) {
      console.log('[TabManager] Cannot show confirmation - tab was closed:', tabId);
      return;
    }

    const confirmationMessage: ShowConfirmationMessage = {
      type: 'SHOW_CONFIRMATION',
      data: {
        message: message || '로그인 완료 후 확인 버튼을 클릭해주세요.',
        buttonText: buttonText, // undefined일 수 있음 (워크플로우 실행 중)
        position: position || 'top',
        variant: variant || 'default',
        icon: icon || 'alert',
        showClose: showClose !== undefined ? showClose : true,
        parentTabId,
      },
    };

    try {
      await chrome.tabs.sendMessage(tabId, confirmationMessage);
      console.log('[TabManager] Confirmation UI shown on child tab:', {
        tabId,
        position,
        variant,
        icon,
        showClose,
      });
    } catch (error) {
      console.warn('[TabManager] Failed to show confirmation UI:', error);
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
   * 최상위 부모 탭까지 체인을 따라 올라가서 찾습니다.
   * @param tabId - 시작 탭 ID
   * @returns 최상위 부모 탭 ID (없으면 undefined)
   */
  private findRootParentTab(tabId: number): number | undefined {
    const visited = new Set<number>(); // 순환 참조 방지
    let currentTabId: number | undefined = tabId;

    while (currentTabId) {
      if (visited.has(currentTabId)) {
        // 순환 참조 감지
        console.warn(`[TabManager] Circular reference detected in tab origins: ${currentTabId}`);
        return undefined;
      }
      visited.add(currentTabId);

      const parentTabId = this.tabOrigins.get(currentTabId);
      if (!parentTabId) {
        // 더 이상 부모가 없으면 이것이 최상위 부모
        return currentTabId === tabId ? undefined : currentTabId;
      }

      currentTabId = parentTabId;
    }

    return undefined;
  }

  /**
   * 직접 부모 탭으로 포커스 (단계적으로 올라가기)
   */
  private async focusParentTab(tabId: number): Promise<void> {
    // 직접 부모 탭 찾기 (최상위가 아닌)
    const directParentTabId = this.tabOrigins.get(tabId);
    if (!directParentTabId) {
      console.log(`[TabManager] No direct parent tab found for tab ${tabId}`);
      return;
    }

    // 닫힌 탭의 관계 제거 (직접 관계만)
    this.tabOrigins.delete(tabId);
    this.trackedChildTabs.delete(tabId);

    try {
      const parentTab = await chrome.tabs.get(directParentTabId);
      if (!parentTab) {
        console.log(`[TabManager] Direct parent tab ${directParentTabId} not found`);
        return;
      }

      await chrome.tabs.update(directParentTabId, { active: true });

      if (typeof parentTab.windowId === 'number') {
        try {
          await chrome.windows.update(parentTab.windowId, { focused: true });
        } catch (windowError) {
          console.warn('[TabManager] Failed to focus parent window:', windowError);
        }
      }

      console.log(
        `[TabManager] Focused direct parent tab ${directParentTabId} after closing child tab ${tabId}`
      );
    } catch (error) {
      console.warn(
        `[TabManager] Failed to focus direct parent tab ${directParentTabId} after closing child tab ${tabId}:`,
        error
      );
    }
  }

  /**
   * 특정 탭의 직접 부모 탭 ID를 가져옵니다.
   * @param tabId - 탭 ID
   * @returns 직접 부모 탭 ID (없으면 undefined)
   */
  getDirectParentTabId(tabId: number): number | undefined {
    return this.tabOrigins.get(tabId);
  }

  /**
   * 특정 탭이 워크플로우 실행 중인지 확인합니다.
   * @param tabId - 탭 ID
   * @returns 워크플로우 실행 중이면 true
   */
  isExecutingWorkflow(tabId: number): boolean {
    return this.executingWorkflowTabs.has(tabId);
  }

  /**
   * 특정 탭이 추적 중인 자식 탭인지 확인합니다.
   * @param tabId - 탭 ID
   * @returns 추적 중인 자식 탭이면 true
   */
  isTrackedChildTab(tabId: number): boolean {
    return this.trackedChildTabs.has(tabId);
  }

  /**
   * 특정 탭의 최상위 부모 탭 ID를 가져옵니다.
   * @param tabId - 탭 ID
   * @returns 최상위 부모 탭 ID (없으면 undefined)
   */
  getRootParentTabId(tabId: number): number | undefined {
    return this.findRootParentTab(tabId);
  }

  /**
   * 특정 탭에서 시작해서 실제 워크플로우가 실행 중인 탭을 찾습니다.
   * @param tabId - 시작 탭 ID
   * @returns 워크플로우 실행 중인 탭 ID (없으면 undefined)
   */
  findExecutingWorkflowTab(tabId: number): number | undefined {
    const visited = new Set<number>();
    let currentTabId: number | undefined = tabId;

    // 현재 탭부터 시작해서 부모를 따라 올라가면서 워크플로우 실행 중인 탭 찾기
    while (currentTabId) {
      if (visited.has(currentTabId)) {
        return undefined; // 순환 참조 방지
      }
      visited.add(currentTabId);

      // 현재 탭이 워크플로우 실행 중이면 반환
      if (this.executingWorkflowTabs.has(currentTabId)) {
        return currentTabId;
      }

      // 부모 탭 찾기
      currentTabId = this.tabOrigins.get(currentTabId);
    }

    return undefined;
  }

  /**
   * 특정 탭부터 최상위 부모까지의 모든 중간 탭 ID를 반환합니다.
   * @param tabId - 시작 탭 ID
   * @returns 중간 탭 ID 배열 (자식부터 부모 직전까지)
   */
  getIntermediateTabs(tabId: number): number[] {
    const intermediateTabs: number[] = [];
    const rootParentTabId = this.findRootParentTab(tabId);
    
    if (!rootParentTabId || rootParentTabId === tabId) {
      return intermediateTabs;
    }

    const visited = new Set<number>();
    let currentTabId: number | undefined = tabId;

    while (currentTabId && currentTabId !== rootParentTabId) {
      if (visited.has(currentTabId)) break;
      visited.add(currentTabId);

      const parentTabId = this.tabOrigins.get(currentTabId);
      if (!parentTabId || parentTabId === rootParentTabId) {
        break;
      }

      // 중간 탭들만 추가 (워크플로우 실행 중인 탭은 제외)
      if (!this.executingWorkflowTabs.has(parentTabId)) {
        intermediateTabs.push(parentTabId);
      }

      currentTabId = parentTabId;
    }

    return intermediateTabs;
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
