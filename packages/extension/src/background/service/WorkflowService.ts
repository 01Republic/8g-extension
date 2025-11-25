import { Block } from '@/blocks';
import { TabManager } from '../chrome/TabManager';
import { CollectWorkflowNewTabMessage, ErrorResponse } from '@/types/internal-messages';
import { ExecutionContext, WorkflowRunner } from '@/workflow';
import { WorkflowStepRunResult, WorkspaceItemDto } from '@/sdk/types';

export type ExecutionStatusController = {
  show: (tabId: number, message?: string) => Promise<void>;
  hide: (tabId: number) => Promise<void>;
};

export type SideModalController = {
  show: (tabId: number) => Promise<void>;
  open: (tabId: number) => Promise<void>;
  setWorkspaces: (tabId: number, workspaces: WorkspaceItemDto[]) => Promise<void>;
  updateSiteInfo: (tabId: number, siteName: string, favicon?: string) => Promise<void>;
  setLoginStatus: (tabId: number, isLoggedIn: boolean) => Promise<void>;
  isOpen: (tabId: number) => Promise<boolean>;
  hide: (tabId: number) => Promise<void>;
  close: (tabId: number) => Promise<void>;
};



/**
 * Workflow Service
 *
 * 워크플로우 실행을 처리하는 서비스입니다.
 */
export class WorkflowService {
  private workflowRunner: WorkflowRunner;
  private statusController!: ExecutionStatusController;
  private sideModalController!: SideModalController;
  private lastWorkflowResults: Map<number, any> = new Map(); // tabId -> last workflow result
  private lastWorkflowRequests: Map<number, CollectWorkflowNewTabMessage['data']> = new Map(); // tabId -> last request
  private workspacePromises: Map<number, {resolve: (value: any) => void, reject: (error: any) => void}> = new Map(); // tabId -> promise handlers

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

    this.sideModalController = {
      // 기본 상태 제어
      show: (tabId: number) => this.tabManager.showSideModal(tabId),
      hide: (tabId: number) => this.tabManager.hideSideModal(tabId),
      open: (tabId: number) => this.tabManager.openSideModal(tabId), // show와 동일하게 처리
      close: (tabId: number) => this.tabManager.closeSideModal(tabId),

      // 데이터 업데이트
      setWorkspaces: (tabId: number, workspaces: WorkspaceItemDto[]) => this.tabManager.setWorkspaces(tabId, workspaces),
      updateSiteInfo: (tabId: number, siteName: string, favicon?: string) => this.tabManager.updateSideModalSiteInfo(tabId, siteName, favicon),
      setLoginStatus: (tabId: number, isLoggedIn: boolean) => this.tabManager.setSideModalLoginStatus(tabId, isLoggedIn),

      // 상태 조회
      isOpen: (tabId: number) => this.tabManager.isSideModalOpen(tabId),
    };

    const executeWithHooks = async (
      tabId: number, 
      run: () => Promise<{steps: WorkflowStepRunResult<any>[], tabId: number, context: ExecutionContext}>,
      workflowType?: string,
      workflowRequest?: CollectWorkflowNewTabMessage['data']
    ) => {
      try {
        // getWorkspaces 타입일 때만 SideModal 표시
        if (workflowType === 'getWorkspaces') {
          const result = await run();
          console.log('=== WORKFLOW RESULT ===');
          console.log('Full result:', result);
          console.log('Last step:', result.steps[result.steps.length - 1]);
          console.log('Last step result:', result.steps[result.steps.length - 1].result);
          
          // 마지막 성공한 스텝에서 워크스페이스 데이터 추출
          let workspacesData = [];
          
          // 유효한 워크스페이스 데이터인지 검증하는 함수
          const isValidWorkspaceArray = (arr: any[]): boolean => {
            if (!Array.isArray(arr) || arr.length === 0) return true; // 빈 배열은 유효함 (로그인 안됨 상태)
            
            // 배열의 첫 번째 요소가 워크스페이스 객체인지 확인
            const firstItem = arr[0];
            return (
              typeof firstItem === 'object' &&
              firstItem !== null &&
              'id' in firstItem &&
              'name' in firstItem &&
              typeof firstItem.id === 'string' &&
              typeof firstItem.name === 'string' &&
              // 네트워크 요청 객체가 아닌지 확인 (url, method, status 속성이 있으면 네트워크 객체)
              !('url' in firstItem && 'method' in firstItem && 'status' in firstItem)
            );
          };
          
          // 마지막부터 거꾸로 탐색하여 실제 데이터가 있는 스텝 찾기
          for (let i = result.steps.length - 1; i >= 0; i--) {
            const step = result.steps[i];
            if (step.success && step.result) {
              // result가 배열인 경우 - 워크스페이스 데이터인지 검증 후 사용
              if (Array.isArray(step.result) && isValidWorkspaceArray(step.result)) {
                workspacesData = step.result;
                console.log(`Found workspaces in step ${i} (array):`, workspacesData);
                break;
              }
              // result.data가 배열인 경우 - 워크스페이스 데이터인지 검증 후 사용
              else if (step.result.data && Array.isArray(step.result.data) && isValidWorkspaceArray(step.result.data)) {
                workspacesData = step.result.data;
                console.log(`Found workspaces in step ${i} (result.data):`, workspacesData);
                break;
              }
              // result가 객체이고 workspace 관련 속성이 있는 경우
              else if (typeof step.result === 'object' && step.result !== null) {
                // workspaces 속성 확인
                if (step.result.workspaces && Array.isArray(step.result.workspaces) && isValidWorkspaceArray(step.result.workspaces)) {
                  workspacesData = step.result.workspaces;
                  console.log(`Found workspaces in step ${i} (result.workspaces):`, workspacesData);
                  break;
                }
              }
            }
          }
          
          console.log('Final extracted workspaces:', workspacesData);
          
          // 결과 저장 (refresh를 위해)
          this.lastWorkflowResults.set(tabId, result);
          this.lastWorkflowRequests.set(tabId, workflowRequest || {} as any);
          
          await this.sideModalController.setWorkspaces(tabId, workspacesData);
          await this.sideModalController.show(tabId);
          
          // 기존 Promise가 있으면 바로 결과 반환 (refresh인 경우)
          const existingPromise = this.workspacePromises.get(tabId);
          if (existingPromise) {
            // refresh인 경우 - Promise를 새로 만들지 않고 결과만 업데이트
            return result;
          }
          
          // 첫 실행인 경우 - Promise로 블로킹 (authenticate 버튼을 기다림)
          return new Promise<typeof result>((resolve, reject) => {
            this.workspacePromises.set(tabId, {
              resolve: () => {
                // 가장 최신 결과를 가져와서 반환
                const latestResult = this.lastWorkflowResults.get(tabId) || result;
                resolve(latestResult);
              },
              reject
            });
          });
        } else {
          // 일반 워크플로우는 기존 ExecutionStatus UI 사용
          await this.statusController.show(tabId, '워크플로우 실행 중');
          const result = await run();
          return result;
        }
      } finally {
        // getWorkspaces가 아닌 경우에만 UI 숨기기
        if (workflowType !== 'getWorkspaces') {
          await this.statusController.hide(tabId);
        }
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
        requestData.originTabId,
        requestData
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

  /**
   * 워크스페이스 선택 완료 처리 (authenticate 버튼)
   */
  async completeWorkspaceSelection(tabId: number): Promise<void> {
    console.log('[WorkflowService] Completing workspace selection for tab:', tabId);
    
    // Promise resolve - 최신 워크스페이스 데이터 반환
    const promise = this.workspacePromises.get(tabId);
    console.log('[WorkflowService] Promise:', promise);
    console.log('[WorkflowService] Last workflow results:', this.lastWorkflowResults.get(tabId));
    if (promise) {
      promise.resolve(this.lastWorkflowResults.get(tabId)); // resolve 함수 내부에서 최신 데이터를 가져옴
      this.workspacePromises.delete(tabId);
    }
    
    // SideModal 숨기기
    await this.sideModalController.hide(tabId);
    
    // 저장된 데이터 정리
    this.lastWorkflowResults.delete(tabId);
    this.lastWorkflowRequests.delete(tabId);
  }

  /**
   * 워크플로우 재실행 (refresh 버튼)
   */
  async refreshWorkspaceWorkflow(tabId: number): Promise<void> {
    const lastRequest = this.lastWorkflowRequests.get(tabId);
    if (lastRequest) {
      console.log('[WorkflowService] Refreshing workspace workflow for tab:', tabId);
      
      try {
        // 1. 탭 강력 새로고침 (캐시 무시)
        await chrome.tabs.reload(tabId, { bypassCache: true });
        
        // 2. 페이지 로드 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. targetUrl로 이동
        await chrome.tabs.update(tabId, { url: lastRequest.targetUrl });
        
        // 4. 페이지 완전히 로드될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. 같은 탭에서 워크플로우 재실행
        const result = await this.workflowRunner.runInExistingTab(
          lastRequest.workflow,
          tabId,
          lastRequest
        );
        
        // 새로운 결과로 업데이트
        this.lastWorkflowResults.set(tabId, result);
        
        console.log('[WorkflowService] Refresh complete, new result:', result);
        
        // 마지막 성공한 스텝에서 워크스페이스 데이터 추출
        let workspacesData = [];
        
        // 유효한 워크스페이스 데이터인지 검증하는 함수 (동일한 로직)
        const isValidWorkspaceArray = (arr: any[]): boolean => {
          if (!Array.isArray(arr) || arr.length === 0) return true; // 빈 배열은 유효함 (로그인 안됨 상태)
          
          // 배열의 첫 번째 요소가 워크스페이스 객체인지 확인
          const firstItem = arr[0];
          return (
            typeof firstItem === 'object' &&
            firstItem !== null &&
            'id' in firstItem &&
            'name' in firstItem &&
            typeof firstItem.id === 'string' &&
            typeof firstItem.name === 'string' &&
            // 네트워크 요청 객체가 아닌지 확인 (url, method, status 속성이 있으면 네트워크 객체)
            !('url' in firstItem && 'method' in firstItem && 'status' in firstItem)
          );
        };
        
        // 마지막부터 거꾸로 탐색하여 실제 데이터가 있는 스텝 찾기
        for (let i = result.steps.length - 1; i >= 0; i--) {
          const step = result.steps[i];
          if (step.success && step.result) {
            // result가 배열인 경우 - 워크스페이스 데이터인지 검증 후 사용
            if (Array.isArray(step.result) && isValidWorkspaceArray(step.result)) {
              workspacesData = step.result;
              console.log(`[Refresh] Found workspaces in step ${i} (array):`, workspacesData);
              break;
            }
            // result.data가 배열인 경우 - 워크스페이스 데이터인지 검증 후 사용
            else if (step.result.data && Array.isArray(step.result.data) && isValidWorkspaceArray(step.result.data)) {
              workspacesData = step.result.data;
              console.log(`[Refresh] Found workspaces in step ${i} (result.data):`, workspacesData);
              break;
            }
            // result가 객체이고 workspace 관련 속성이 있는 경우
            else if (typeof step.result === 'object' && step.result !== null) {
              // workspaces 속성 확인
              if (step.result.workspaces && Array.isArray(step.result.workspaces) && isValidWorkspaceArray(step.result.workspaces)) {
                workspacesData = step.result.workspaces;
                console.log(`[Refresh] Found workspaces in step ${i} (result.workspaces):`, workspacesData);
                break;
              }
            }
          }
        }
        
        console.log('[Refresh] Final extracted workspaces:', workspacesData);
        
        // 워크스페이스 업데이트
        await this.sideModalController.setWorkspaces(tabId, workspacesData);
        
        // 모달은 이미 열려있으니 데이터만 업데이트
        console.log('[WorkflowService] Updated workspaces after refresh');
      } catch (error) {
        console.error('[WorkflowService] Failed to refresh workflow:', error);
      }
    }
  }
}
