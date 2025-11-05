import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectWorkflowNewTabMessage,
  CdpClickMessage,
  CdpKeypressMessage,
  FetchApiMessage,
  ExportDataMessage,
  NetworkCatchMessage,
  isCdpClickMessage,
  isCdpKeypressMessage,
  isFetchApiMessage,
  isExportDataMessage,
  isNetworkCatchMessage,
  ErrorResponse,
} from '@/types/internal-messages';
import { AiParsingService } from '../service/AiParsingService';
import { CdpService } from '../service/CdpService';
import { WorkflowService } from '../service/WorkflowService';
import { ApiService } from '../service/ApiService';
import { ExportDataService } from '../service/ExportDataService';

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

      if ((message as any).type === 'FETCH_API' && isFetchApiMessage(message)) {
        this.handleAsyncFetchApi(message.data, sendResponse);
        return true;
      }

      if ((message as any).type === 'EXPORT_DATA' && isExportDataMessage(message)) {
        this.handleAsyncExportData(message.data, sendResponse);
        return true;
      }

      if ((message as any).type === 'NETWORK_CATCH' && isNetworkCatchMessage(message)) {
        const tabId = message.data.tabId || sender.tab?.id;
        if (!tabId) {
          sendResponse({ $isError: true, message: 'Tab ID not found', data: null } as ErrorResponse);
          return false;
        }
        this.handleAsyncNetworkCatch({ ...message.data, tabId }, sendResponse);
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

  // AI 파싱 요청 처리
  private async handleAsyncAiParseData(
    requestData: any,
    sendResponse: (response: any) => void
  ) {
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

  // Network Catch 요청 처리
  private async handleAsyncNetworkCatch(
    requestData: NetworkCatchMessage['data'] & { tabId: number },
    sendResponse: (response: any) => void
  ) {
    try {
      console.log('[BackgroundManager] Handle network catch request:', requestData);
      
      // TabManager에서 네트워크 요청 데이터 가져오기
      const allRequests = this.tabManager.getNetworkRequests(requestData.tabId);
      
      // 필터링 로직
      let filteredRequests = allRequests;
      
      // URL 패턴 필터
      if (requestData.urlPattern) {
        const pattern = new RegExp(requestData.urlPattern);
        filteredRequests = filteredRequests.filter(req => pattern.test(req.url));
      }
      
      // Method 필터
      if (requestData.method) {
        filteredRequests = filteredRequests.filter(req => req.method === requestData.method);
      }
      
      // Status 필터
      if (requestData.status !== undefined) {
        if (typeof requestData.status === 'number') {
          filteredRequests = filteredRequests.filter(req => req.response?.status === requestData.status);
        } else {
          const { min, max } = requestData.status;
          filteredRequests = filteredRequests.filter(req => {
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
        filteredRequests = filteredRequests.filter(req => 
          req.response?.mimeType?.includes(requestData.mimeType!)
        );
      }
      
      // Request Body 필터
      if (requestData.requestBodyPattern) {
        filteredRequests = filteredRequests.filter(req => {
          if (!req.requestPostData) return false;
          
          // 문자열 패턴인 경우 - 부분 일치 검사
          if (typeof requestData.requestBodyPattern === 'string') {
            return req.requestPostData.includes(requestData.requestBodyPattern);
          }
          
          // 객체 패턴인 경우 - JSON 파싱 후 속성 매칭
          if (typeof requestData.requestBodyPattern === 'object') {
            try {
              const bodyJson = JSON.parse(req.requestPostData);
              const pattern = requestData.requestBodyPattern as Record<string, any>;
              
              // 패턴의 모든 키-값이 요청 body에 포함되어 있는지 확인
              return Object.entries(pattern).every(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                  return JSON.stringify(bodyJson[key]) === JSON.stringify(value);
                }
                return bodyJson[key] === value;
              });
            } catch {
              // JSON 파싱 실패시 false 반환
              return false;
            }
          }
          
          return false;
        });
      }
      
      // 응답 데이터 구성
      const responses = filteredRequests.map(req => {
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
