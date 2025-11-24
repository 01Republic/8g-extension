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
        window.dispatchEvent(new CustomEvent('8g-hide-execution-status'));
        sendResponse({ success: true });
        return false;
      }

      if (isShowConfirmationMessage(message)) {
        console.log('[InternalMessageHandler] Show confirmation:', message.data);
        const {
          message: msg,
          buttonText,
          variant = 'default',
          icon = 'alert',
          showClose = true,
          parentTabId,
        } = message.data;

        // 확인 버튼 클릭 시 탭을 닫고 원래 탭으로 포커스하는 콜백 생성
        // buttonText가 있을 때만 onConfirm 제공 (워크플로우 실행 중에는 버튼이 없음)
        const onConfirm =
          buttonText && parentTabId
            ? () => {
                console.log(
                  '[InternalMessageHandler] User confirmed, closing tab and focusing parent:',
                  parentTabId
                );

                // Background에 탭 닫기 요청
                chrome.runtime.sendMessage({
                  type: 'CLOSE_TAB_AND_FOCUS_PARENT',
                  data: { parentTabId },
                });

                // UI 숨김
                window.dispatchEvent(new CustomEvent('8g-hide-execution-status'));
              }
            : undefined;

        // 닫기 버튼 클릭 시 콜백
        const onClose = () => {
          console.log('[InternalMessageHandler] User closed confirmation UI');
          window.dispatchEvent(new CustomEvent('8g-hide-execution-status'));
        };

        window.dispatchEvent(
          new CustomEvent('8g-show-execution-status', {
            detail: {
              message: msg,
              buttonText,
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

      // SideModal 메시지 핸들러들
      if ((message as any).type === 'SHOW_SIDE_MODAL') {
        console.log('[InternalMessageHandler] Show side modal:', (message as any).data);
        window.dispatchEvent(
          new CustomEvent('8g-show-side-modal', {
            detail: (message as any).data,
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if ((message as any).type === 'HIDE_SIDE_MODAL') {
        console.log('[InternalMessageHandler] Hide side modal');
        window.dispatchEvent(new CustomEvent('8g-hide-side-modal'));
        sendResponse({ success: true });
        return false;
      }

      if ((message as any).type === 'UPDATE_SIDE_MODAL_WORKSPACES') {
        console.log('[InternalMessageHandler] Update side modal workspaces:', (message as any).data);
        window.dispatchEvent(
          new CustomEvent('8g-update-side-modal-workspaces', {
            detail: (message as any).data,
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if ((message as any).type === 'UPDATE_SIDE_MODAL_SITE_INFO') {
        console.log('[InternalMessageHandler] Update side modal site info:', (message as any).data);
        window.dispatchEvent(
          new CustomEvent('8g-update-side-modal-site-info', {
            detail: (message as any).data,
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if ((message as any).type === 'UPDATE_SIDE_MODAL_LOGIN_STATUS') {
        console.log('[InternalMessageHandler] Update side modal login status:', (message as any).data);
        window.dispatchEvent(
          new CustomEvent('8g-update-side-modal-login-status', {
            detail: (message as any).data,
          })
        );
        sendResponse({ success: true });
        return false;
      }

      if ((message as any).type === 'GET_SIDE_MODAL_STATUS') {
        console.log('[InternalMessageHandler] Get side modal status');
        // 상태 요청에 대한 응답을 위해 콜백 방식 사용
        let responseReceived = false;
        const callback = (response: any) => {
          if (!responseReceived) {
            responseReceived = true;
            sendResponse(response);
          }
        };
        
        window.dispatchEvent(
          new CustomEvent('8g-get-side-modal-status', {
            detail: { callback },
          })
        );
        
        // 타임아웃 설정 (2초 후 기본값 응답)
        setTimeout(() => {
          if (!responseReceived) {
            responseReceived = true;
            sendResponse({ isOpen: false });
          }
        }, 2000);
        
        return true; // 비동기 응답을 위해 true 반환
      }

      if ((message as any).type === 'GET_SIDE_MODAL_DATA') {
        console.log('[InternalMessageHandler] Get side modal data');
        // background에서 현재 탭의 저장된 데이터를 가져오는 요청
        chrome.runtime.sendMessage({ type: 'GET_SIDE_MODAL_DATA' })
          .then(response => sendResponse(response))
          .catch(error => {
            console.warn('Failed to get side modal data from background:', error);
            sendResponse({ workspaces: [] });
          });
        return true; // 비동기 응답
      }
    
      // Check status dismissed handler
      if ((message as any).type === 'CHECK_STATUS_DISMISSED') {
        const { notificationId, message: msg } = (message as any).payload || {};
        window.dispatchEvent(
          new CustomEvent('8g-notification-dismissed', {
            detail: { notificationId, message: msg },
          })
        );
        sendResponse({ success: true });
        return false;
      }

      // Get account info message handler
      if ((message as any).type === 'GET_ACCOUNT_INFO') {
        console.log('[InternalMessageHandler] Get account info message received');
        const accountInfo = this.extractAccountInfo();
        sendResponse(accountInfo);
        return false;
      }

      return false;
    });
  }

  /**
   * 현재 페이지에서 계정 정보 추출
   */
  private extractAccountInfo(): any {
    const emailElement =
      document.querySelector('[data-email]') ||
      document.querySelector('.user-email') ||
      document.querySelector('input[type="email"][disabled]');

    const nameElement =
      document.querySelector('[data-name]') ||
      document.querySelector('.user-name') ||
      document.querySelector('.profile-name');

    return {
      email: emailElement?.textContent || (emailElement as HTMLInputElement)?.value || null,
      name: nameElement?.textContent || null,
    };
  }
}
