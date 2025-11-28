import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectWorkflowNewTabMessage,
  CdpClickMessage,
  CdpKeypressMessage,
  CdpExecuteJavaScriptMessage,
  FetchApiMessage,
  ExportDataMessage,
  NetworkCatchMessage,
  isCdpClickMessage,
  isCdpKeypressMessage,
  isCdpExecuteJavaScriptMessage,
  isFetchApiMessage,
  isExportDataMessage,
  isNetworkCatchMessage,
  ErrorResponse,
} from '@/types/internal-messages';
import { MESSAGE_TYPES } from '@/content/dom/ChromeDOMProvider';
import { AiParsingService } from '../service/AiParsingService';
import { CdpService } from '../service/CdpService';
import { WorkflowService } from '../service/WorkflowService';
import { ApiService } from '../service/ApiService';
import { ExportDataService } from '../service/ExportDataService';
import {
  matchesObjectPattern,
  parseRequestBodyToObject,
} from '@/background/utils/request-body-parser';

export class BackgroundManager {
  private aiParsingService: AiParsingService;
  private cdpService: CdpService;
  private workflowService: WorkflowService;
  private apiService: ApiService;
  private tabManager: TabManager;

  constructor() {
    this.aiParsingService = new AiParsingService();
    this.cdpService = new CdpService();
    this.tabManager = new TabManager(this.cdpService);
    this.workflowService = new WorkflowService(this.tabManager);
    this.apiService = new ApiService();
  }

  initHandler() {
    // Chrome runtime message handler (internal communication)
    chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
      if ((message as any).type === MESSAGE_TYPES.COLLECT_WORKFLOW_NEW_TAB) {
        const workflowMessage = message as CollectWorkflowNewTabMessage;
        const requestData = {
          ...workflowMessage.data,
          originTabId: workflowMessage.data.originTabId ?? sender.tab?.id,
        };
        this.handleAsyncCollectWorkflow(requestData, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.CDP_CLICK && isCdpClickMessage(message)) {
        // Get tabId from sender
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({
            $isError: true,
            message: 'Tab ID not found in sender',
            data: null,
          } as ErrorResponse);
          return false;
        }
        this.handleAsyncCdpClick({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.CDP_KEYPRESS && isCdpKeypressMessage(message)) {
        // Get tabId from sender
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({
            $isError: true,
            message: 'Tab ID not found in sender',
            data: null,
          } as ErrorResponse);
          return false;
        }
        this.handleAsyncCdpKeypress({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if (
        (message as any).type === MESSAGE_TYPES.CDP_EXECUTE_JAVASCRIPT &&
        isCdpExecuteJavaScriptMessage(message)
      ) {
        // Get tabId from sender
        const tabId = sender.tab?.id;
        if (!tabId) {
          sendResponse({
            $isError: true,
            message: 'Tab ID not found in sender',
            data: null,
          } as ErrorResponse);
          return false;
        }
        this.handleAsyncCdpExecuteJavaScript({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.AI_PARSE_DATA) {
        this.handleAsyncAiParseData((message as any).data, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.FETCH_API && isFetchApiMessage(message)) {
        this.handleAsyncFetchApi(message.data, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.EXPORT_DATA && isExportDataMessage(message)) {
        this.handleAsyncExportData(message.data, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.NETWORK_CATCH && isNetworkCatchMessage(message)) {
        const tabId = message.data.tabId || sender.tab?.id;
        if (!tabId) {
          sendResponse({
            $isError: true,
            message: 'Tab ID not found',
            data: null,
          } as ErrorResponse);
          return false;
        }
        this.handleAsyncNetworkCatch({ ...message.data, tabId }, sendResponse);
        return true;
      }

      if ((message as any).type === MESSAGE_TYPES.CLOSE_TAB_AND_FOCUS_PARENT) {
        const tabId = sender.tab?.id;
        const parentTabId = (message as any).data?.parentTabId;

        if (!tabId) {
          sendResponse({
            $isError: true,
            message: 'Tab ID not found in sender',
            data: null,
          } as ErrorResponse);
          return false;
        }

        this.handleAsyncCloseTabAndFocusParent(tabId, parentTabId, sendResponse);
        return true;
      }

      sendResponse({ $isError: true, message: 'Invalid message type', data: {} } as ErrorResponse);
      return false;
    });
  }

  // 워크플로우 실행 요청 처리
  private async handleAsyncCollectWorkflow(
    requestData: CollectWorkflowNewTabMessage['data'],
    sendResponse: (response: any) => void
  ) {
    await this.workflowService.handleCollectWorkflow(requestData, sendResponse);
  }

  // CDP 클릭 요청 처리
  private async handleAsyncCdpClick(
    requestData: CdpClickMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    await this.cdpService.handleClick(requestData, sendResponse);
  }

  // CDP 키보드 입력 요청 처리
  private async handleAsyncCdpKeypress(
    requestData: CdpKeypressMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    await this.cdpService.handleKeypress(requestData, sendResponse);
  }

  // CDP JavaScript 실행 요청 처리
  private async handleAsyncCdpExecuteJavaScript(
    requestData: CdpExecuteJavaScriptMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    await this.cdpService.handleExecuteJavaScript(requestData, sendResponse);
  }

  // AI 파싱 요청 처리
  private async handleAsyncAiParseData(requestData: any, sendResponse: (response: any) => void) {
    await this.aiParsingService.handleParseData(requestData, sendResponse);
  }

  // API 요청 처리
  private async handleAsyncFetchApi(
    requestData: FetchApiMessage['data'],
    sendResponse: (response: any) => void
  ) {
    await this.apiService.handleRequest(requestData, sendResponse);
  }

  // Export Data 요청 처리
  private async handleAsyncExportData(
    requestData: ExportDataMessage['data'],
    sendResponse: (response: any) => void
  ) {
    try {
      const result = await ExportDataService.exportData(requestData);
      sendResponse({ data: result });
    } catch (error) {
      console.error('[BackgroundManager] Export data error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Unknown error in export data',
        data: null,
      } as ErrorResponse);
    }
  }


  // 탭 닫기 및 부모 탭 포커스 처리 (단계적으로 올라가면서 정리)
  private async handleAsyncCloseTabAndFocusParent(
    tabId: number,
    parentTabId: number | undefined,
    sendResponse: (response: any) => void
  ) {
    try {
      console.log('[BackgroundManager] Closing tab and focusing parent:', { tabId, parentTabId });

      // 실제 워크플로우가 실행 중인 탭 찾기 (wait-for-condition 블록이 대기 중인 탭)
      const executingWorkflowTabId = this.tabManager.findExecutingWorkflowTab(tabId);

      // 탭 체인을 따라 올라가면서 단계적으로 정리
      // 예: 자식2 -> 자식 -> 부모
      let currentTabId: number | undefined = tabId;
      const tabsToClose: number[] = [];
      const visited = new Set<number>();

      // 워크플로우 실행 중인 탭까지 올라가면서 닫을 탭들 수집
      while (currentTabId) {
        if (visited.has(currentTabId)) break;
        visited.add(currentTabId);

        // 워크플로우 실행 중인 탭은 닫지 않음
        // 단, 추적 중인 자식 탭이면서 동시에 executingWorkflowTabs에 있는 경우는 제외
        // (자식 탭은 Execution Status만 표시하고 실제로는 워크플로우를 실행하지 않음)
        const isExecutingWorkflow = this.tabManager.isExecutingWorkflow(currentTabId);
        const isTrackedChild = this.tabManager.isTrackedChildTab(currentTabId);

        if (isExecutingWorkflow && !isTrackedChild) {
          console.log(
            `[BackgroundManager] Reached executing workflow tab ${currentTabId}, stopping collection`
          );
          break;
        }

        // 추적 중인 자식 탭이거나 워크플로우 실행 중이 아닌 탭은 닫을 목록에 추가
        tabsToClose.push(currentTabId);
        currentTabId = this.tabManager.getDirectParentTabId(currentTabId);
      }

      console.log('[BackgroundManager] Tabs to close in order:', tabsToClose);

      // 역순으로 닫기 (가장 깊은 탭부터)
      // 각 탭을 닫을 때마다 직접 부모로 포커스 이동
      for (let i = tabsToClose.length - 1; i >= 0; i--) {
        const tabToClose = tabsToClose[i];
        try {
          console.log(
            `[BackgroundManager] Closing tab ${tabToClose} (${tabsToClose.length - i}/${tabsToClose.length})`
          );
          // 각 탭을 닫으면 직접 부모로 포커스 이동
          await this.tabManager.closeTab(tabToClose);

          // 짧은 딜레이로 사용자가 단계적으로 올라가는 것을 볼 수 있도록
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.warn(`[BackgroundManager] Failed to close tab ${tabToClose}:`, error);
        }
      }

      // 실제 워크플로우 실행 중인 탭에 확인 이벤트 전달
      if (executingWorkflowTabId && executingWorkflowTabId !== tabId) {
        console.log(
          `[BackgroundManager] Sending confirmation event to executing workflow tab: ${executingWorkflowTabId}`
        );
        try {
          // wait-for-condition 블록에서 대기 중인 확인 이벤트 트리거
          await chrome.tabs.sendMessage(executingWorkflowTabId, {
            type: MESSAGE_TYPES.TRIGGER_CONFIRMATION,
            data: {},
          });
        } catch (error) {
          console.warn(
            `[BackgroundManager] Failed to send confirmation to workflow tab ${executingWorkflowTabId}:`,
            error
          );
        }
      } else {
        console.log(
          `[BackgroundManager] Skipping confirmation event: executingWorkflowTabId=${executingWorkflowTabId}, tabId=${tabId}`
        );
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error('[BackgroundManager] Error closing tab:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Failed to close tab',
        data: null,
      } as ErrorResponse);
    }
  }

  // Network Catch 요청 처리
  private async handleAsyncNetworkCatch(
    requestData: NetworkCatchMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    try {
      // TabManager에서 네트워크 요청 데이터 가져오기
      const allRequests = this.tabManager.getNetworkRequests(requestData.tabId);

      // 필터링 로직
      let filteredRequests = allRequests;

      // URL 패턴 필터
      if (requestData.urlPattern) {
        const pattern = new RegExp(requestData.urlPattern);
        filteredRequests = filteredRequests.filter((req) => pattern.test(req.url));
      }

      // Method 필터
      if (requestData.method) {
        filteredRequests = filteredRequests.filter((req) => req.method === requestData.method);
      }

      // Status 필터
      if (requestData.status !== undefined) {
        if (typeof requestData.status === 'number') {
          filteredRequests = filteredRequests.filter(
            (req) => req.response?.status === requestData.status
          );
        } else {
          const { min, max } = requestData.status;
          filteredRequests = filteredRequests.filter((req) => {
            const status = req.response?.status;
            if (!status) return false;
            if (min !== undefined && status < min) return false;
            if (max !== undefined && status > max) return false;
            return true;
          });
        }
      }

      // MIME Type 필터
      if (requestData.mimeType) {
        filteredRequests = filteredRequests.filter((req) =>
          req.response?.mimeType?.includes(requestData.mimeType!)
        );
      }
      console.log('[BackgroundManager] Handle network catch request:', filteredRequests);

      // Request Body 필터
      if (requestData.requestBodyPattern) {
        filteredRequests = filteredRequests.filter((req) => {
          if (!req.requestPostData) return false;

          if (typeof requestData.requestBodyPattern === 'string') {
            console.log(
              '[BackgroundManager] Handle network catch request:',
              req.requestPostData,
              requestData.requestBodyPattern
            );
            return req.requestPostData.includes(requestData.requestBodyPattern);
          }

          const parsedBody = parseRequestBodyToObject(req.requestPostData, req.requestHeaders);
          console.log('[BackgroundManager] Handle network catch request:', parsedBody);
          console.log(
            '[BackgroundManager] Handle network catch request:',
            requestData.requestBodyPattern
          );
          if (!parsedBody) {
            return false;
          }

          console.log(
            '[BackgroundManager] Handle network catch request:',
            matchesObjectPattern(parsedBody, requestData.requestBodyPattern as Record<string, any>)
          );
          return matchesObjectPattern(
            parsedBody,
            requestData.requestBodyPattern as Record<string, any>
          );
        });
      }
      console.log('[BackgroundManager] Handle network catch request:', filteredRequests);
      // 응답 데이터 구성
      const responses = filteredRequests.map((req) => {
        const response: any = {
          url: req.url,
          method: req.method,
          status: req.response?.status,
          statusText: req.response?.statusText,
          mimeType: req.response?.mimeType,
          timestamp: req.timestamp,
        };

        // 헤더 포함 옵션
        if (requestData.includeHeaders) {
          response.requestHeaders = req.requestHeaders;
          response.responseHeaders = req.response?.headers;
          if (req.cookieHeader) {
            response.cookieHeader = req.cookieHeader;
            response.cookies = req.parsedCookies;
          }
        }

        // 요청 본문
        if (req.requestPostData) {
          response.requestBody = req.requestPostData;
        }

        // 응답 본문 처리
        if (req.responseBody) {
          if (req.responseBody.base64Encoded) {
            // Base64 디코딩이 필요한 경우
            response.responseBody = req.responseBody.body;
          } else {
            // JSON 파싱 시도
            try {
              response.responseBody = JSON.parse(req.responseBody.body);
            } catch {
              // 파싱 실패시 원본 문자열 반환
              response.responseBody = req.responseBody.body;
            }
          }
        }

        // 소요 시간 계산
        if (req.loadingFinished) {
          response.duration = (req.loadingFinished.timestamp - req.timestamp) * 1000; // ms
        }

        return response;
      });

      // 반환 형식 결정
      const result = requestData.returnAll ? responses : responses[responses.length - 1] || null;

      sendResponse({ data: result });
    } catch (error) {
      console.error('[BackgroundManager] Network catch error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Failed to fetch network data',
        data: null,
      } as ErrorResponse);
    }
  }
}
