import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectWorkflowNewTabMessage,
  CdpClickMessage,
  CdpKeypressMessage,
  FetchApiMessage,
  isCdpClickMessage,
  isCdpKeypressMessage,
  isFetchApiMessage,
  ErrorResponse,
} from '@/types/internal-messages';
import { AiParsingService } from './AiParsingService';
import { CdpService } from './CdpService';
import { WorkflowService } from './WorkflowService';
import { ApiService } from './ApiService';

export class BackgroundManager {
  private aiParsingService: AiParsingService;
  private cdpService: CdpService;
  private workflowService: WorkflowService;
  private apiService: ApiService;

  constructor() {
    this.aiParsingService = new AiParsingService();
    this.cdpService = new CdpService();
    this.workflowService = new WorkflowService(new TabManager());
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
}
