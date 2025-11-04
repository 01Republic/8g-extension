import { ErrorResponse } from '@/types/internal-messages';

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  type?: string;
  timestamp: number;
  requestHeaders?: Record<string, string>;
  requestPostData?: string;
  response?: {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    mimeType?: string;
    encodedDataLength?: number;
    dataLength?: number;
  };
  responseBody?: {
    body: string;
    base64Encoded: boolean;
  };
  loadingFinished?: {
    timestamp: number;
    encodedDataLength: number;
  };
  loadingFailed?: {
    timestamp: number;
    errorText: string;
    canceled: boolean;
  };
}

/**
 * Chrome DevTools Protocol (CDP) Service
 *
 * CDP를 사용한 마우스 클릭, 키보드 입력 처리 및 네트워크 추적을 담당합니다.
 */
export class CdpService {
  // 탭별 디버거 연결 상태 관리
  private attachedTabs: Set<number> = new Set();
  
  // 탭별 네트워크 요청 데이터
  private networkRequests: Map<number, Map<string, NetworkRequest>> = new Map();
  
  // 네트워크 이벤트 리스너 등록 여부
  private networkListenersAttached: Set<number> = new Set();
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

  /**
   * 네트워크 추적을 시작합니다.
   * 
   * @param tabId - 추적할 탭 ID
   */
  async startNetworkTracking(tabId: number): Promise<void> {
    console.log('[CdpService] Starting network tracking for tab:', tabId);
    
    try {
      // 이미 연결되어 있지 않으면 디버거 연결
      if (!this.attachedTabs.has(tabId)) {
        await chrome.debugger.attach({ tabId }, '1.3');
        this.attachedTabs.add(tabId);
        console.log('[CdpService] Debugger attached for network tracking:', tabId);
      }

      // 네트워크 요청 저장소 초기화
      this.networkRequests.set(tabId, new Map());

      // Network 도메인 활성화
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable', {
        maxTotalBufferSize: 10000000,
        maxResourceBufferSize: 5000000
      });

      // 이벤트 리스너가 등록되지 않았으면 등록
      if (!this.networkListenersAttached.has(tabId)) {
        this.attachNetworkListeners();
        this.networkListenersAttached.add(tabId);
      }

      console.log('[CdpService] Network tracking started for tab:', tabId);
    } catch (error) {
      console.error('[CdpService] Failed to start network tracking:', error);
      throw error;
    }
  }

  /**
   * 네트워크 추적을 중지합니다.
   * 
   * @param tabId - 추적 중지할 탭 ID
   */
  async stopNetworkTracking(tabId: number): Promise<void> {
    console.log('[CdpService] Stopping network tracking for tab:', tabId);
    
    try {
      if (this.attachedTabs.has(tabId)) {
        // Network 도메인 비활성화
        await chrome.debugger.sendCommand({ tabId }, 'Network.disable', {});
        
        // 디버거 연결 해제
        await chrome.debugger.detach({ tabId });
        this.attachedTabs.delete(tabId);
        
        console.log('[CdpService] Network tracking stopped for tab:', tabId);
      }

      // 리스너 등록 상태 제거
      this.networkListenersAttached.delete(tabId);
    } catch (error) {
      console.error('[CdpService] Failed to stop network tracking:', error);
      // 에러가 발생해도 상태는 정리
      this.attachedTabs.delete(tabId);
      this.networkListenersAttached.delete(tabId);
    }
  }

  /**
   * 네트워크 이벤트 리스너를 등록합니다.
   */
  private attachNetworkListeners(): void {
    // 이미 리스너가 등록되어 있으면 스킵
    if (chrome.debugger.onEvent.hasListener(this.handleDebuggerEvent)) {
      return;
    }

    chrome.debugger.onEvent.addListener(this.handleDebuggerEvent.bind(this));
    console.log('[CdpService] Network event listeners attached');
  }

  /**
   * 디버거 이벤트를 처리합니다.
   */
  private handleDebuggerEvent(
    source: chrome.debugger.Debuggee,
    method: string,
    params?: any
  ): void {
    const tabId = source.tabId;
    if (!tabId || !this.networkRequests.has(tabId)) {
      return;
    }

    const requests = this.networkRequests.get(tabId)!;

    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleRequestWillBeSent(tabId, params, requests);
        break;
      case 'Network.responseReceived':
        this.handleResponseReceived(tabId, params, requests);
        break;
      case 'Network.loadingFinished':
        // async 처리를 위해 별도로 실행
        this.handleLoadingFinished(tabId, params, requests).catch(error => 
          console.warn('[CdpService] Error handling loadingFinished:', error)
        );
        break;
      case 'Network.loadingFailed':
        this.handleLoadingFailed(tabId, params, requests);
        break;
    }
  }

  /**
   * 요청 시작 이벤트를 처리합니다.
   */
  private handleRequestWillBeSent(
    tabId: number,
    params: any,
    requests: Map<string, NetworkRequest>
  ): void {
    const { requestId, request, timestamp, type } = params;
    
    const networkRequest: NetworkRequest = {
      requestId,
      url: request.url,
      method: request.method,
      type,
      timestamp,
      requestHeaders: request.headers,
      requestPostData: request.postData,
    };

    requests.set(requestId, networkRequest);
    console.log(`[CdpService] Request started [${tabId}]:`, request.url);
  }

  /**
   * 응답 수신 이벤트를 처리합니다.
   */
  private handleResponseReceived(
    tabId: number,
    params: any,
    requests: Map<string, NetworkRequest>
  ): void {
    const { requestId, response } = params;
    const request = requests.get(requestId);
    
    if (request) {
      request.response = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        mimeType: response.mimeType,
        encodedDataLength: response.encodedDataLength,
      };
      console.log(`[CdpService] Response received [${tabId}]:`, response.status, request.url);
    }
  }

  /**
   * 로딩 완료 이벤트를 처리합니다.
   */
  private async handleLoadingFinished(
    tabId: number,
    params: any,
    requests: Map<string, NetworkRequest>
  ): Promise<void> {
    const { requestId, timestamp, encodedDataLength } = params;
    const request = requests.get(requestId);
    
    if (request) {
      request.loadingFinished = {
        timestamp,
        encodedDataLength,
      };
      
      // 응답 본문 가져오기 시도 (실패해도 계속 진행)
      try {
        const response = await chrome.debugger.sendCommand(
          { tabId },
          'Network.getResponseBody',
          { requestId }
        );
        
        if (response) {
          console.log('response', response);
          request.responseBody = {
            body: (response as any).body,
            base64Encoded: (response as any).base64Encoded || false,
          };
          console.log(`[CdpService] Response body captured [${tabId}]:`, request.url);
        }
      } catch (error) {
        // 응답 본문을 가져올 수 없는 경우도 있음 (예: 리다이렉트, 이미지 등)
        console.debug(`[CdpService] Could not get response body for ${request.url}:`, error);
      }
      
      console.log(`[CdpService] Loading finished [${tabId}]:`, request.url);
    }
  }

  /**
   * 로딩 실패 이벤트를 처리합니다.
   */
  private handleLoadingFailed(
    tabId: number,
    params: any,
    requests: Map<string, NetworkRequest>
  ): void {
    const { requestId, timestamp, errorText, canceled } = params;
    const request = requests.get(requestId);
    
    if (request) {
      request.loadingFailed = {
        timestamp,
        errorText,
        canceled,
      };
      console.log(`[CdpService] Loading failed [${tabId}]:`, errorText, request.url);
    }
  }

  /**
   * 특정 탭의 네트워크 요청 데이터를 가져옵니다.
   * 
   * @param tabId - 탭 ID
   * @returns 네트워크 요청 배열
   */
  getNetworkRequests(tabId: number): NetworkRequest[] {
    const requests = this.networkRequests.get(tabId);
    if (!requests) {
      return [];
    }
    return Array.from(requests.values());
  }

  /**
   * 특정 탭의 네트워크 요청 데이터를 초기화합니다.
   * 
   * @param tabId - 탭 ID
   */
  clearNetworkRequests(tabId: number): void {
    this.networkRequests.delete(tabId);
    console.log('[CdpService] Network requests cleared for tab:', tabId);
  }

}

