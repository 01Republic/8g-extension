import {
  ContentMessage,
  isExecuteBlockMessage,
  isShowExecutionStatusMessage,
  isHideExecutionStatusMessage,
  isShowConfirmationMessage,
  isCloseTabMessage,
  isTriggerConfirmationMessage,
} from '@/types/internal-messages';
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

      if (isShowExecutionStatusMessage(message)) {
        console.log('[InternalMessageHandler] Show execution status:', message.data);
        window.dispatchEvent(
          new CustomEvent('8g-show-execution-status', {
            detail: {
              message: message.data.message || '워크플로우 실행 중',
              statusType: message.data.statusType || 'loading',
              icon: message.data.icon || 'default',
              position: message.data.position || 'bottom-right',
            },
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if (isHideExecutionStatusMessage(message)) {
        console.log('[InternalMessageHandler] Hide execution status');
        window.dispatchEvent(new CustomEvent('8g-hide-execution-status'));
        // 워크플로우 실행 종료 시 초록색 ConfirmationUI도 함께 숨김
        window.dispatchEvent(new CustomEvent('8g-hide-confirmation-ui'));
        sendResponse({ success: true });
        return false;
      }

      if (isShowConfirmationMessage(message)) {
        console.log('[InternalMessageHandler] Show confirmation:', message.data);
        const {
          message: msg,
          buttonText,
          position = 'top',
          variant = 'default',
          icon = 'alert',
          showClose = true,
          parentTabId,
        } = message.data;

        // 확인 버튼 클릭 시 탭을 닫고 원래 탭으로 포커스하는 콜백 생성
        // buttonText가 있을 때만 onConfirm 제공 (워크플로우 실행 중에는 버튼이 없음)
        const onConfirm = buttonText && parentTabId
          ? () => {
              console.log('[InternalMessageHandler] User confirmed, closing tab and focusing parent:', parentTabId);
              
              // Background에 탭 닫기 요청
              chrome.runtime.sendMessage({
                type: 'CLOSE_TAB_AND_FOCUS_PARENT',
                data: { parentTabId },
              });

              // UI 숨김
              window.dispatchEvent(new CustomEvent('8g-hide-confirmation-ui'));
            }
          : undefined;

        // 닫기 버튼 클릭 시 콜백
        const onClose = () => {
          console.log('[InternalMessageHandler] User closed confirmation UI');
          window.dispatchEvent(new CustomEvent('8g-hide-confirmation-ui'));
        };

        window.dispatchEvent(
          new CustomEvent('8g-show-confirmation-ui', {
            detail: {
              message: msg,
              buttonText,
              position,
              variant,
              icon,
              showClose,
              onConfirm,
              onClose,
            },
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if (isCloseTabMessage(message)) {
        console.log('[InternalMessageHandler] Close tab message received');
        // Content script에서는 직접 탭을 닫을 수 없으므로 background로 요청
        const { parentTabId } = message.data;
        chrome.runtime.sendMessage({
          type: 'CLOSE_TAB_AND_FOCUS_PARENT',
          data: { parentTabId },
        });
        sendResponse({ success: true });
        return false;
      }

      if (isTriggerConfirmationMessage(message)) {
        console.log('[InternalMessageHandler] Trigger confirmation message received');
        // wait-for-condition 블록의 확인 이벤트 트리거
        // 이 이벤트는 wait-for-condition 블록에서 대기 중인 onConfirm 콜백을 호출합니다
        window.dispatchEvent(new CustomEvent('8g-trigger-confirmation'));
        sendResponse({ success: true });
        return false;
      }

      return false;
    });
  }
}
