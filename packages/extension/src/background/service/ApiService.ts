import { ErrorResponse } from '@/types/internal-messages';

export interface ApiRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers: Record<string, string>;
  body?: any;
  timeout: number;
  parseJson: boolean;
  returnHeaders: boolean;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers?: Record<string, string>;
}

export class ApiService {
  /**
   * API 요청을 처리하고 응답을 전송합니다.
   */
  async handleRequest(
    requestData: ApiRequest,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[ApiService] Handle API request:', requestData.url);
      if (requestData.body) {
        console.log('requestData.body', requestData.body);
      }

      const result = await this.fetchData(requestData);

      sendResponse({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[ApiService] API request error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Unknown error in API request',
        data: null,
      } as ErrorResponse);
    }
  }

  /**
   * 실제 fetch 요청 수행
   */
  async fetchData(request: ApiRequest): Promise<ApiResponse> {
    const { url, method, headers, body, timeout, parseJson, returnHeaders } = request;

    console.log(`[ApiService] Fetching ${method} ${url}`);

    // AbortController로 타임아웃 처리
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // fetch 옵션 구성
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      // body가 있으면 추가 (GET, HEAD는 body 없음)
      if (body && !['GET', 'HEAD'].includes(method)) {
        if (typeof body === 'string') {
          fetchOptions.body = body;
        } else {
          // 객체인 경우 JSON으로 변환
          fetchOptions.body = JSON.stringify(body);
          // Content-Type이 없으면 추가
          if (!headers['Content-Type'] && !headers['content-type']) {
            fetchOptions.headers = {
              ...headers,
              'Content-Type': 'application/json',
            };
          }
        }
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // 응답 데이터 파싱
      let data: any;
      const contentType = response.headers.get('content-type') || '';

      if (parseJson && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // JSON 파싱 실패 시 텍스트로
          data = await response.text();
        }
      } else {
        data = await response.text();
      }

      // 응답 헤더 수집 (옵션)
      let responseHeaders: Record<string, string> | undefined;
      if (returnHeaders) {
        responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders![key] = value;
        });
      }

      const result: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
      };

      console.log(`[ApiService] Response status: ${response.status}`);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }
}
