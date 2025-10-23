import { ErrorResponse } from '@/types/internal-messages';

/**
 * Chrome DevTools Protocol (CDP) Service
 *
 * CDP를 사용한 마우스 클릭과 키보드 입력 처리를 담당합니다.
 */
export class CdpService {
  /**
   * CDP 클릭 요청을 처리하고 응답을 전송합니다.
   * 
   * @param requestData - 클릭 요청 데이터 (tabId, x, y 포함)
   * @param sendResponse - 응답 전송 함수
   */
  async handleClick(
    requestData: { tabId: number; x: number; y: number },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[CdpService] Handle click request:', requestData);

      const { tabId, x, y } = requestData;

      await this.click(tabId, x, y);

      sendResponse({ success: true, data: { clicked: true } });
    } catch (error) {
      console.error('[CdpService] Click error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP click failed',
        data: null,
      } as ErrorResponse);
    }
  }

  /**
   * CDP 키보드 입력 요청을 처리하고 응답을 전송합니다.
   * 
   * @param requestData - 키보드 입력 요청 데이터
   * @param sendResponse - 응답 전송 함수
   */
  async handleKeypress(
    requestData: {
      tabId: number;
      key: string;
      code: string;
      keyCode: number;
      modifiers: string[];
    },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[CdpService] Handle keypress request:', requestData);

      const { tabId, key, code, keyCode, modifiers } = requestData;

      await this.keypress(tabId, key, code, keyCode, modifiers);

      sendResponse({ success: true, data: { pressed: true } });
    } catch (error) {
      console.error('[CdpService] Keypress error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP keypress failed',
        data: null,
      } as ErrorResponse);
    }
  }
  /**
   * CDP를 사용하여 지정된 좌표에 마우스 클릭을 실행합니다.
   * 
   * @param tabId - 대상 탭 ID
   * @param x - 클릭할 X 좌표
   * @param y - 클릭할 Y 좌표
   */
  async click(tabId: number, x: number, y: number): Promise<void> {
    console.log('[CdpService] Click request - tabId:', tabId, 'x:', x, 'y:', y);

    // Debugger 연결
    await chrome.debugger.attach({ tabId }, '1.3');
    console.log('[CdpService] Debugger attached to tab:', tabId);

    try {
      // 1. Mouse move to position
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
        button: 'none',
        clickCount: 0,
      });

      // 2. Mouse down
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        clickCount: 1,
      });

      // 3. Mouse up
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x,
        y,
        button: 'left',
        clickCount: 1,
      });

      console.log('[CdpService] Click completed successfully');
    } finally {
      // Debugger 연결 해제
      await chrome.debugger.detach({ tabId });
      console.log('[CdpService] Debugger detached from tab:', tabId);
    }
  }

  /**
   * CDP를 사용하여 키보드 입력을 실행합니다.
   * 
   * @param tabId - 대상 탭 ID
   * @param key - 입력할 키
   * @param code - 키 코드
   * @param keyCode - 가상 키 코드
   * @param modifiers - 수정자 키 배열 (Alt, Control, Meta, Shift)
   */
  async keypress(
    tabId: number,
    key: string,
    code: string,
    keyCode: number,
    modifiers: string[] = []
  ): Promise<void> {
    console.log('[CdpService] Keypress request - tabId:', tabId, 'key:', key);

    // Debugger 연결
    await chrome.debugger.attach({ tabId }, '1.3');
    console.log('[CdpService] Debugger attached to tab:', tabId);

    try {
      // Convert modifiers to CDP format
      const cdpModifiers = this.convertModifiersToCdp(modifiers);

      // 1. Key down
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        nativeVirtualKeyCode: keyCode,
        modifiers: cdpModifiers,
      });

      // 2. Key up
      await chrome.debugger.sendCommand({ tabId }, 'Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        nativeVirtualKeyCode: keyCode,
        modifiers: cdpModifiers,
      });

      console.log('[CdpService] Keypress completed successfully');
    } finally {
      // Debugger 연결 해제
      await chrome.debugger.detach({ tabId });
      console.log('[CdpService] Debugger detached from tab:', tabId);
    }
  }

  /**
   * 수정자 키 배열을 CDP 수정자 비트마스크로 변환합니다.
   * 
   * @param modifiers - 수정자 키 배열
   * @returns CDP 수정자 비트마스크
   */
  private convertModifiersToCdp(modifiers: string[]): number {
    let mask = 0;
    if (modifiers.includes('Alt')) mask |= 1;
    if (modifiers.includes('Control')) mask |= 2;
    if (modifiers.includes('Meta')) mask |= 4;
    if (modifiers.includes('Shift')) mask |= 8;
    return mask;
  }

}

