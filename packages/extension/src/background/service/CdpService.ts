import { ErrorResponse } from '@/types/internal-messages';

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  type?: string;
  timestamp: number;
  requestHeaders?: Record<string, string>;
  cookieHeader?: string;
  parsedCookies?: Record<string, string>;
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

interface NetworkRequestExtraInfo {
  headers?: Record<string, string>;
  headersText?: string;
}

interface DebuggerSessionState {
  networkEnabled: boolean;
}

/**
 * Chrome DevTools Protocol (CDP) Service
 *
 * CDP를 사용한 마우스 클릭, 키보드 입력 처리 및 네트워크 추적을 담당합니다.
 */
export class CdpService {
  // 탭별 디버거 세션 상태 관리
  private debuggerSessions: Map<number, DebuggerSessionState> = new Map();

  // 탭별 네트워크 요청 데이터
  private networkRequests: Map<number, Map<string, NetworkRequest>> = new Map();
  // 탭별로 아직 요청 객체가 만들어지지 않은 ExtraInfo 이벤트 보관
  private pendingExtraInfo: Map<number, Map<string, NetworkRequestExtraInfo>> = new Map();

  // 디버거 이벤트 리스너 등록 여부
  private debuggerListenerRegistered = false;
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
   * CDP JavaScript 실행 요청을 처리하고 응답을 전송합니다.
   *
   * @param requestData - JavaScript 실행 요청 데이터
   * @param sendResponse - 응답 전송 함수
   */
  async handleExecuteJavaScript(
    requestData: {
      tabId: number;
      code: string;
      returnResult: boolean;
      timeout: number;
    },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const { tabId, code, returnResult, timeout } = requestData;

      const result = await this.executeJavaScript(tabId, code, returnResult, timeout);

      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('[CdpService] ExecuteJavaScript error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP JavaScript execution failed',
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
    // Debugger 연결
    await this.ensureAttached(tabId);

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
    // Debugger 연결
    await this.ensureAttached(tabId);

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
  }

  /**
   * CDP를 사용하여 JavaScript 코드를 실행합니다.
   *
   * @param tabId - 대상 탭 ID
   * @param code - 실행할 JavaScript 코드
   * @param returnResult - 결과를 반환할지 여부
   * @param timeout - 실행 타임아웃 (ms)
   * @returns 실행 결과 (returnResult가 true일 때)
   */
  async executeJavaScript(
    tabId: number,
    code: string,
    returnResult: boolean = true,
    timeout: number = 5000
  ): Promise<any> {
    // Debugger 연결
    await this.ensureAttached(tabId);

    // Runtime.evaluate를 사용하여 JavaScript 실행
    const result = await Promise.race([
      chrome.debugger.sendCommand({ tabId }, 'Runtime.evaluate', {
        expression: code,
        returnByValue: returnResult,
        awaitPromise: true, // Promise를 자동으로 기다림
        userGesture: true, // 사용자 제스처로 처리 (일부 API 호출에 필요)
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout)
      ),
    ]);

    const evalResult = result as any;

    // 실행 중 예외 발생 확인
    if (evalResult.exceptionDetails) {
      const exceptionText = evalResult.exceptionDetails.exception?.description ||
                           evalResult.exceptionDetails.text ||
                           'Unknown JavaScript error';
      throw new Error(`JavaScript execution error: ${exceptionText}`);
    }

    // 결과 반환
    if (returnResult && evalResult.result) {
      return evalResult.result.value;
    }

    return null;
  }

  /**
   * 특정 탭에 디버거를 연결합니다.
   */
  async attachDebugger(tabId: number): Promise<void> {
    await this.ensureAttached(tabId);
  }

  /**
   * 특정 탭에서 디버거를 분리합니다.
   */
  async detachDebugger(tabId: number): Promise<void> {
    const session = this.debuggerSessions.get(tabId);
    if (!session) {
      return;
    }

    if (session.networkEnabled) {
      try {
        await chrome.debugger.sendCommand({ tabId }, 'Network.disable', {});
      } catch (error) {
        console.warn(`[CdpService] Failed to disable network for tab ${tabId}:`, error);
      }
    }

    try {
      await chrome.debugger.detach({ tabId });
    } catch (error) {
      console.warn(`[CdpService] Failed to detach debugger for tab ${tabId}:`, error);
    } finally {
      this.debuggerSessions.delete(tabId);
      this.pendingExtraInfo.delete(tabId);
      this.detachNetworkListenersIfIdle();
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
    try {
      await this.ensureAttached(tabId);
      const session = this.debuggerSessions.get(tabId)!;

      // 네트워크 요청 저장소 초기화
      this.networkRequests.set(tabId, new Map());
      this.pendingExtraInfo.set(tabId, new Map());

      if (!session.networkEnabled) {
        // Network 도메인 활성화
        await chrome.debugger.sendCommand({ tabId }, 'Network.enable', {
          maxTotalBufferSize: 10000000,
          maxResourceBufferSize: 5000000,
        });
        session.networkEnabled = true;
      }

      this.attachNetworkListeners();
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
    try {
      const session = this.debuggerSessions.get(tabId);
      if (session?.networkEnabled) {
        await chrome.debugger.sendCommand({ tabId }, 'Network.disable', {});
        session.networkEnabled = false;
      }

      // 보조 데이터 삭제
      this.pendingExtraInfo.delete(tabId);
    } catch (error) {
      console.error('[CdpService] Failed to stop network tracking:', error);
      // 에러가 발생해도 상태는 정리
      const session = this.debuggerSessions.get(tabId);
      if (session) {
        session.networkEnabled = false;
      }
      this.pendingExtraInfo.delete(tabId);
    }
  }

  /**
   * 네트워크 이벤트 리스너를 등록합니다.
   */
  private attachNetworkListeners(): void {
    if (this.debuggerListenerRegistered) {
      return;
    }

    chrome.debugger.onEvent.addListener(this.handleDebuggerEvent);
    this.debuggerListenerRegistered = true;
  }

  /**
   * 활성 세션이 없으면 네트워크 이벤트 리스너를 제거합니다.
   */
  private detachNetworkListenersIfIdle(): void {
    if (!this.debuggerListenerRegistered) {
      return;
    }

    if (this.debuggerSessions.size > 0) {
      return;
    }

    chrome.debugger.onEvent.removeListener(this.handleDebuggerEvent);
    this.debuggerListenerRegistered = false;
  }

  /**
   * 디버거 이벤트를 처리합니다.
   */
  private handleDebuggerEvent = (
    source: chrome.debugger.Debuggee,
    method: string,
    params?: any
  ): void => {
    const tabId = source.tabId;
    if (!tabId || !this.networkRequests.has(tabId)) {
      return;
    }

    const requests = this.networkRequests.get(tabId)!;

    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleRequestWillBeSent(tabId, params, requests);
        break;
      case 'Network.requestWillBeSentExtraInfo':
        this.handleRequestWillBeSentExtraInfo(tabId, params);
        break;
      case 'Network.responseReceived':
        this.handleResponseReceived(params, requests);
        break;
      case 'Network.loadingFinished':
        // async 처리를 위해 별도로 실행
        this.handleLoadingFinished(tabId, params, requests).catch((error) =>
          console.warn('[CdpService] Error handling loadingFinished:', error)
        );
        break;
      case 'Network.loadingFailed':
        this.handleLoadingFailed(params, requests);
        break;
    }
  };

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

    this.injectCookieFromHeaders(networkRequest, request.headers);
    this.applyPendingExtraInfo(tabId, requestId, networkRequest);

    requests.set(requestId, networkRequest);
  }

  /**
   * 추가 헤더 정보(민감 헤더 포함) 이벤트 처리
   */
  private handleRequestWillBeSentExtraInfo(tabId: number, params: any): void {
    const { requestId } = params;
    const requests = this.networkRequests.get(tabId);
    const extraInfo = this.normalizeExtraInfo(params);

    if (requests?.has(requestId)) {
      const request = requests.get(requestId)!;
      this.applyExtraInfoToRequest(request, extraInfo);
    } else {
      const pendingMap = this.getOrCreatePendingExtraInfoMap(tabId);
      const existing = pendingMap.get(requestId);
      pendingMap.set(requestId, this.mergeExtraInfo(existing, extraInfo));
    }
  }

  /**
   * 응답 수신 이벤트를 처리합니다.
   */
  private handleResponseReceived(params: any, requests: Map<string, NetworkRequest>): void {
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
        const response = await chrome.debugger.sendCommand({ tabId }, 'Network.getResponseBody', {
          requestId,
        });

        if (response) {
          request.responseBody = {
            body: (response as any).body,
            base64Encoded: (response as any).base64Encoded || false,
          };
        }
      } catch (error) {
        // 응답 본문을 가져올 수 없는 경우도 있음 (예: 리다이렉트, 이미지 등)
        console.debug(`[CdpService] Could not get response body for ${request.url}:`, error);
      }
    }
  }

  /**
   * 로딩 실패 이벤트를 처리합니다.
   */
  private handleLoadingFailed(params: any, requests: Map<string, NetworkRequest>): void {
    const { requestId, timestamp, errorText, canceled } = params;
    const request = requests.get(requestId);

    if (request) {
      request.loadingFailed = {
        timestamp,
        errorText,
        canceled,
      };
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
    this.pendingExtraInfo.delete(tabId);
  }

  /**
   * Pending ExtraInfo 데이터를 현재 요청 객체에 적용합니다.
   */
  private applyPendingExtraInfo(tabId: number, requestId: string, request: NetworkRequest): void {
    const pendingMap = this.pendingExtraInfo.get(tabId);
    if (!pendingMap) {
      return;
    }

    const extraInfo = pendingMap.get(requestId);
    if (!extraInfo) {
      return;
    }

    this.applyExtraInfoToRequest(request, extraInfo);
    pendingMap.delete(requestId);
  }

  /**
   * ExtraInfo 이벤트를 정규화합니다.
   */
  private normalizeExtraInfo(params: any): NetworkRequestExtraInfo {
    return {
      headers: params.headers,
      headersText: params.headersText,
    };
  }

  /**
   * 기존 ExtraInfo 데이터와 새 데이터를 병합합니다.
   */
  private mergeExtraInfo(
    existing: NetworkRequestExtraInfo | undefined,
    next: NetworkRequestExtraInfo
  ): NetworkRequestExtraInfo {
    if (!existing) {
      return {
        headers: next.headers ? { ...next.headers } : undefined,
        headersText: next.headersText,
      };
    }

    return {
      headers: {
        ...(existing.headers || {}),
        ...(next.headers || {}),
      },
      headersText: next.headersText ?? existing.headersText,
    };
  }

  /**
   * ExtraInfo 데이터를 요청 객체에 적용합니다.
   */
  private applyExtraInfoToRequest(
    request: NetworkRequest,
    extraInfo: NetworkRequestExtraInfo
  ): void {
    const combinedHeaders: Record<string, string> = {
      ...(request.requestHeaders || {}),
      ...(extraInfo.headers || {}),
    };

    if (extraInfo.headersText) {
      Object.assign(combinedHeaders, this.parseHeadersText(extraInfo.headersText));
    }

    if (Object.keys(combinedHeaders).length > 0) {
      request.requestHeaders = combinedHeaders;
    }

    this.injectCookieFromHeaders(request, combinedHeaders);
  }

  /**
   * ExtraInfo 보관소를 가져오거나 생성합니다.
   */
  private getOrCreatePendingExtraInfoMap(tabId: number): Map<string, NetworkRequestExtraInfo> {
    if (!this.pendingExtraInfo.has(tabId)) {
      this.pendingExtraInfo.set(tabId, new Map());
    }
    return this.pendingExtraInfo.get(tabId)!;
  }

  /**
   * 헤더 텍스트를 파싱하여 객체로 변환합니다.
   */
  private parseHeadersText(headersText?: string): Record<string, string> {
    if (!headersText) {
      return {};
    }

    return headersText.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        return acc;
      }

      const name = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!name) {
        return acc;
      }

      acc[name] = value;
      return acc;
    }, {});
  }

  /**
   * 헤더에서 Cookie 값을 추출해 요청 객체에 저장합니다.
   */
  private injectCookieFromHeaders(
    networkRequest: NetworkRequest,
    headers?: Record<string, string>
  ): void {
    if (!headers) {
      return;
    }

    const cookieHeader = headers.Cookie || headers.cookie;
    if (!cookieHeader) {
      return;
    }

    networkRequest.cookieHeader = cookieHeader;
    networkRequest.parsedCookies = this.parseCookieHeader(cookieHeader);
  }

  /**
   * Parse a Cookie header string into a key-value record.
   *
   * @param cookieHeader - Raw Cookie header string
   */
  private parseCookieHeader(cookieHeader: string): Record<string, string> {
    return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
      const [name, ...rest] = part.split('=');
      if (!name) {
        return acc;
      }
      const trimmedName = name.trim();
      const value = rest.join('=').trim();
      if (!trimmedName) {
        return acc;
      }
      acc[trimmedName] = value;
      return acc;
    }, {});
  }

  private async ensureAttached(tabId: number): Promise<void> {
    if (this.debuggerSessions.has(tabId)) {
      return;
    }

    console.log('[CdpService] Attaching debugger for tab', tabId);
    await chrome.debugger.attach({ tabId }, '1.3');
    this.debuggerSessions.set(tabId, { networkEnabled: false });
    this.attachNetworkListeners();
  }
}
