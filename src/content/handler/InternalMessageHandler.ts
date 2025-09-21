import { ContentMessage, isExecuteBlockMessage } from '@/types/internal-messages';
import { MessageKernel } from '../kernel/MessageKernel';

/**
 * Chrome Extension 내부 메시지 핸들러
 * Background Script ↔ Content Script 간의 메시지 처리 담당
 */
export class InternalMessageHandler {
  constructor(private kernel: MessageKernel) {}

  /**
   * Background script로부터의 메시지 리스너 초기화
   */
  initializeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
      if (isExecuteBlockMessage(message)) {
        this.kernel
          .handleRuntimeMessage(message)
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse(this.kernel.createErrorResponse('', error)));
        return true; // Keep message channel open for async response
      }

      return false;
    });
  }
}
