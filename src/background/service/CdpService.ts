import { ErrorResponse } from '@/types/internal-messages';

interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  timestamp: number;
  requestHeaders?: Record<string, string>;
  responseStatus?: number;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  resourceType?: string;
  mimeType?: string;
  fromCache?: boolean;
  timing?: {
    requestTime: number;
    loadingFinished?: number;
    duration?: number;
  };
}

interface CaptureNetworkResult {
  requests: NetworkRequest[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    fromCacheCount: number;
  };
}

/**
 * Chrome DevTools Protocol (CDP) Service
 * 
 * CDP를 사용한 마우스 클릭, 키보드 입력 및 네트워크 캡처 처리를 담당합니다.
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

  /**
   * 네트워크 캡처 요청을 처리하고 응답을 전송합니다.
   * 
   * @param requestData - 네트워크 캡처 요청 데이터
   * @param sendResponse - 응답 전송 함수
   */
  async handleCaptureNetwork(
    requestData: {
      tabId: number;
      targetUrl: string;
      waitForLoadComplete: boolean;
      timeout: number;
      includeRequestHeaders: boolean;
      includeResponseHeaders: boolean;
      includeResponseBody: boolean;
      urlFilter?: string;
      resourceTypes?: string[];
    },
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[CdpService] Handle capture network request:', requestData);

      const result = await this.captureNetwork(requestData);

      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('[CdpService] Capture network error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'CDP network capture failed',
        data: null,
      } as ErrorResponse);
    }
  }

  /**
   * CDP를 사용하여 페이지 로드 시 네트워크 요청을 캡처합니다.
   * 
   * @param options - 캡처 옵션
   * @returns 캡처된 네트워크 요청 데이터
   */
  async captureNetwork(options: {
    tabId: number;
    targetUrl: string;
    waitForLoadComplete: boolean;
    timeout: number;
    includeRequestHeaders: boolean;
    includeResponseHeaders: boolean;
    includeResponseBody: boolean;
    urlFilter?: string;
    resourceTypes?: string[];
  }): Promise<CaptureNetworkResult> {
    const {
      tabId,
      targetUrl,
      waitForLoadComplete,
      timeout,
      includeRequestHeaders,
      includeResponseHeaders,
      includeResponseBody,
      urlFilter,
      resourceTypes,
    } = options;

    console.log('[CdpService] Starting network capture for tab:', tabId, 'URL:', targetUrl);

    // 수집된 네트워크 요청 저장소
    const requests = new Map<string, NetworkRequest>();
    const urlFilterRegex = urlFilter ? new RegExp(urlFilter) : null;

    // Debugger 연결
    await chrome.debugger.attach({ tabId }, '1.3');
    console.log('[CdpService] Debugger attached for network capture');

    try {
      // Network 도메인 활성화
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
      console.log('[CdpService] Network domain enabled');

      // Page 도메인 활성화
      if (waitForLoadComplete) {
        await chrome.debugger.sendCommand({ tabId }, 'Page.enable');
        console.log('[CdpService] Page domain enabled');
      }

      // 이벤트 리스너 설정
      const eventListener = (
        source: chrome.debugger.Debuggee,
        method: string,
        params?: any
      ) => {
        if (source.tabId !== tabId) return;

        // 요청 시작
        if (method === 'Network.requestWillBeSent') {
          const { requestId, request, type, timestamp } = params;
          
          // URL 필터 적용
          if (urlFilterRegex && !urlFilterRegex.test(request.url)) {
            return;
          }

          // 리소스 타입 필터 적용
          if (resourceTypes && resourceTypes.length > 0 && !resourceTypes.includes(type)) {
            return;
          }

          requests.set(requestId, {
            requestId,
            url: request.url,
            method: request.method,
            timestamp,
            requestHeaders: includeRequestHeaders ? request.headers : undefined,
            resourceType: type,
            timing: {
              requestTime: timestamp,
            },
          });

          console.log('[CdpService] Request captured:', request.method, request.url);
        }

        // 응답 수신
        if (method === 'Network.responseReceived') {
          const { requestId, response, type, timestamp } = params;
          const existingRequest = requests.get(requestId);

          if (existingRequest) {
            existingRequest.responseStatus = response.status;
            existingRequest.responseStatusText = response.statusText;
            existingRequest.responseHeaders = includeResponseHeaders ? response.headers : undefined;
            existingRequest.mimeType = response.mimeType;
            existingRequest.fromCache = response.fromDiskCache || response.fromServiceWorker;

            console.log('[CdpService] Response received:', response.status, existingRequest.url);
          }
        }

        // 로딩 완료
        if (method === 'Network.loadingFinished') {
          const { requestId, timestamp } = params;
          const existingRequest = requests.get(requestId);

          if (existingRequest && existingRequest.timing) {
            existingRequest.timing.loadingFinished = timestamp;
            existingRequest.timing.duration = timestamp - existingRequest.timing.requestTime;

            console.log('[CdpService] Loading finished:', existingRequest.url);
          }
        }

        // 로딩 실패
        if (method === 'Network.loadingFailed') {
          const { requestId } = params;
          const existingRequest = requests.get(requestId);

          if (existingRequest) {
            existingRequest.responseStatus = 0;
            existingRequest.responseStatusText = 'Failed';

            console.log('[CdpService] Loading failed:', existingRequest.url);
          }
        }
      };

      chrome.debugger.onEvent.addListener(eventListener);

      try {
        // 페이지 로드 완료를 위한 Promise
        const loadCompletePromise = waitForLoadComplete
          ? new Promise<void>((resolve) => {
              const loadListener = (
                source: chrome.debugger.Debuggee,
                method: string
              ) => {
                if (source.tabId === tabId && method === 'Page.loadEventFired') {
                  console.log('[CdpService] Page load event fired');
                  chrome.debugger.onEvent.removeListener(loadListener);
                  resolve();
                }
              };
              chrome.debugger.onEvent.addListener(loadListener);
            })
          : Promise.resolve();

        // 타임아웃 Promise
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Network capture timeout')), timeout);
        });

        // 페이지 네비게이션
        await chrome.debugger.sendCommand({ tabId }, 'Page.navigate', { url: targetUrl });
        console.log('[CdpService] Navigation started to:', targetUrl);

        // 페이지 로드 완료 또는 타임아웃 대기
        await Promise.race([loadCompletePromise, timeoutPromise]);

        // 추가로 조금 더 대기 (마지막 요청들을 수집하기 위해)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 응답 본문 수집 (필요한 경우)
        if (includeResponseBody) {
          console.log('[CdpService] Fetching response bodies...');
          for (const [requestId, request] of requests.entries()) {
            try {
              if (
                request.responseStatus &&
                request.responseStatus >= 200 &&
                request.responseStatus < 300
              ) {
                const result = await chrome.debugger.sendCommand(
                  { tabId },
                  'Network.getResponseBody',
                  { requestId }
                );
                request.responseBody = result.body;
              }
            } catch (error) {
              // 일부 요청은 body를 가져올 수 없을 수 있음 (예: 이미지, 캐시된 리소스 등)
              console.warn('[CdpService] Could not get response body for:', request.url);
            }
          }
        }
      } finally {
        chrome.debugger.onEvent.removeListener(eventListener);
      }

      // 결과 집계
      const requestsArray = Array.from(requests.values());
      const summary = {
        totalRequests: requestsArray.length,
        successfulRequests: requestsArray.filter(
          (r) => r.responseStatus && r.responseStatus >= 200 && r.responseStatus < 400
        ).length,
        failedRequests: requestsArray.filter(
          (r) => !r.responseStatus || r.responseStatus >= 400
        ).length,
        fromCacheCount: requestsArray.filter((r) => r.fromCache).length,
      };

      console.log('[CdpService] Network capture completed. Summary:', summary);

      return {
        requests: requestsArray,
        summary,
      };
    } finally {
      // Network 및 Page 도메인 비활성화
      try {
        await chrome.debugger.sendCommand({ tabId }, 'Network.disable');
        if (waitForLoadComplete) {
          await chrome.debugger.sendCommand({ tabId }, 'Page.disable');
        }
      } catch (error) {
        console.warn('[CdpService] Error disabling domains:', error);
      }

      // Debugger 연결 해제
      await chrome.debugger.detach({ tabId });
      console.log('[CdpService] Debugger detached after network capture');
    }
  }
}

