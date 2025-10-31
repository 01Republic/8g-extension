import { TabManager } from './TabManager';
import {
  BackgroundMessage,
  CollectWorkflowNewTabMessage,
  CdpClickMessage,
  CdpKeypressMessage,
  FetchApiMessage,
  ExportDataMessage,
  isCdpClickMessage,
  isCdpKeypressMessage,
  isFetchApiMessage,
  isExportDataMessage,
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

      if ((message as any).type === 'EXPORT_DATA' && isExportDataMessage(message)) {
        this.handleAsyncExportData(message.data, sendResponse);
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
}
