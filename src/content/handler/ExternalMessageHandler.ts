import {
  WindowMessage,
  CollectDataMessage,
  ExtensionResponseMessage,
  CollectWorkflowMessage,
} from '@/types/external-messages';
import { CollectDataNewTabMessage, CollectWorkflowNewTabMessage } from '@/types/internal-messages';
import { MessageKernel } from '../kernel/MessageKernel';

/**
 * 웹페이지와의 외부 메시지 핸들러
 * Webpage ↔ Content Script 간의 window message 처리 담당
 */
export class ExternalMessageHandler {
  constructor(private kernel: MessageKernel) {}

  /**
   * 웹페이지로부터의 window message 리스너 초기화
   */
  initializeMessageListener(): void {
    window.addEventListener('message', this.handleWindowMessage.bind(this));
  }

  /**
   * 웹페이지로부터의 window message 처리
   */
  private async handleWindowMessage(event: MessageEvent<WindowMessage>): Promise<void> {
    if (event.source !== window) return;

    const message = event.data;

    switch (message.type) {
      case '8G_EXTENSION_CHECK':
        this.handleExtensionCheck();
        break;

      case '8G_COLLECT_DATA':
        await this.handleCollectData(message);
        break;

      case '8G_COLLECT_WORKFLOW':
        await this.handleCollectWorkflow(message as CollectWorkflowMessage);
        break;

      default:
        break;
    }
  }

  /**
   * 확장 프로그램 설치 확인 요청 처리
   */
  private handleExtensionCheck(): void {
    const response: ExtensionResponseMessage = {
      type: '8G_EXTENSION_RESPONSE',
      installed: true,
      version: '1.0.0',
    };
    this.kernel.sendToWebpage(response);
  }

  /**
   * 데이터 수집 요청 처리
   */
  private async handleCollectData(message: CollectDataMessage): Promise<void> {
    try {
      this.validateCollectDataMessage(message);

      // Background script로 데이터 수집 요청 전송
      const backgroundMessage: CollectDataNewTabMessage = {
        type: 'COLLECT_DATA_NEW_TAB',
        data: {
          targetUrl: message.targetUrl,
          block: message.block,
          closeTabAfterCollection: message.closeTabAfterCollection !== false,
          activateTab: message.activateTab === true,
          blockDelay: message.blockDelay || 500, // 기본값 500ms
        },
      };

      try {
        const response = await this.kernel.sendToBackground(backgroundMessage);

        // 웹페이지로 성공 응답
        const successResponse = this.kernel.createSuccessResponse(message.requestId, response);
        this.kernel.sendToWebpage(successResponse);
      } catch (error) {
        // 웹페이지로 에러 응답
        const errorResponse = this.kernel.createErrorResponse(message.requestId, error);
        this.kernel.sendToWebpage(errorResponse);
      }
    } catch (error) {
      const errorResponse = this.kernel.createErrorResponse(message.requestId, error);
      this.kernel.sendToWebpage(errorResponse);
    }
  }

  /**
   * 워크플로우 수집 요청 처리
   */
  private async handleCollectWorkflow(message: CollectWorkflowMessage): Promise<void> {
    try {
      this.validateCollectWorkflowMessage(message);

      const backgroundMessage: CollectWorkflowNewTabMessage = {
        type: 'COLLECT_WORKFLOW_NEW_TAB',
        data: {
          targetUrl: message.targetUrl,
          workflow: message.workflow,
          closeTabAfterCollection: message.closeTabAfterCollection !== false,
          activateTab: message.activateTab === true,
        },
      };

      try {
        const response = await this.kernel.sendToBackground(backgroundMessage);
        const successResponse = this.kernel.createSuccessResponse(message.requestId, response);
        this.kernel.sendToWebpage(successResponse);
      } catch (error) {
        const errorResponse = this.kernel.createErrorResponse(message.requestId, error);
        this.kernel.sendToWebpage(errorResponse);
      }
    } catch (error) {
      const errorResponse = this.kernel.createErrorResponse(message.requestId, error);
      this.kernel.sendToWebpage(errorResponse);
    }
  }

  private validateCollectWorkflowMessage(message: CollectWorkflowMessage): void {
    if (!message.targetUrl) {
      throw new Error('Target URL is required');
    }
    if (!message.workflow) {
      throw new Error('Workflow is required');
    }
    if (!message.workflow.start || !Array.isArray(message.workflow.steps)) {
      throw new Error('Workflow must have start and steps');
    }
  }

  /**
   * 데이터 수집 요청 유효성 검증
   */
  private validateCollectDataMessage(message: CollectDataMessage): void {
    if (!message.targetUrl) {
      throw new Error('Target URL is required');
    }

    if (!message.block) {
      throw new Error('Block is required');
    }
  }
}
