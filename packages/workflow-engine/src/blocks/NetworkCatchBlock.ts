import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, NetworkInterceptOptions } from '../dom';

export interface NetworkCatchBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'network-catch';
  urlPattern?: string; // URL 패턴 (정규식 또는 문자열 포함)
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  status?: number | { min?: number; max?: number }; // 특정 상태 코드 또는 범위
  mimeType?: string; // MIME 타입 필터 (예: 'application/json')
  requestBodyPattern?: string | Record<string, any>; // Request body 필터 (문자열 패턴 또는 JSON 객체)
  waitForRequest?: boolean; // 요청 완료까지 대기 (기본: false)
  waitTimeout?: number; // 대기 타임아웃 (ms, 기본: 5000)
  returnAll?: boolean; // 모든 매칭 요청 반환 (기본: false, 마지막 것만)
  includeHeaders?: boolean; // 요청/응답 헤더 포함 (기본: false)
}

export interface NetworkCatchResponse {
  url: string;
  method: string;
  status: number;
  statusText?: string;
  mimeType?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: any; // 파싱된 JSON 또는 텍스트
  timestamp: number;
  duration?: number; // 요청 시작부터 완료까지 시간 (ms)
}

export const NetworkCatchBlockSchema = z.object({
  name: z.literal('network-catch'),
  urlPattern: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  status: z
    .union([
      z.number(),
      z.object({
        min: z.number().optional(),
        max: z.number().optional(),
      }),
    ])
    .optional(),
  mimeType: z.string().optional(),
  requestBodyPattern: z.union([z.string(), z.record(z.any())]).optional(),
  waitForRequest: z.boolean().optional(),
  waitTimeout: z.number().min(0).optional(),
  returnAll: z.boolean().optional(),
  includeHeaders: z.boolean().optional(),
});

export function validateNetworkCatchBlock(data: unknown): NetworkCatchBlock {
  return NetworkCatchBlockSchema.parse(data) as NetworkCatchBlock;
}

export async function handlerNetworkCatch(
  data: NetworkCatchBlock,
  domProvider: DOMProvider
): Promise<BlockResult<NetworkCatchResponse | NetworkCatchResponse[]>> {
  try {
    console.log('[NetworkCatchBlock] Fetching network requests with pattern:', data.urlPattern);

    // Check if interceptNetwork method is available on the DOMProvider
    if (!domProvider.interceptNetwork) {
      return {
        hasError: true,
        message: 'Network interception is not supported in this environment',
        data: undefined,
      };
    }

    // Create network interception options
    const options: NetworkInterceptOptions = {
      urlPattern: data.urlPattern,
      method: data.method,
      resourceType: data.mimeType,
      waitForResponse: data.waitForRequest || false,
      timeout: data.waitTimeout || 5000,
    };

    // Use DOMProvider's interceptNetwork method
    const networkData = await domProvider.interceptNetwork(options);

    // Process the intercepted data according to block configuration
    let responseData: NetworkCatchResponse | NetworkCatchResponse[];

    if (Array.isArray(networkData)) {
      const processedData = networkData.map(request => ({
        url: request.url || '',
        method: request.method || 'GET',
        status: request.status || 0,
        statusText: request.statusText,
        mimeType: request.mimeType || data.mimeType,
        requestHeaders: data.includeHeaders ? request.requestHeaders : undefined,
        responseHeaders: data.includeHeaders ? request.responseHeaders : undefined,
        requestBody: request.requestBody,
        responseBody: request.responseBody,
        timestamp: request.timestamp || Date.now(),
        duration: request.duration,
      }));

      // Apply status filter if specified
      let filteredData = processedData;
      if (data.status !== undefined) {
        if (typeof data.status === 'number') {
          filteredData = processedData.filter(req => req.status === data.status);
        } else {
          const { min, max } = data.status;
          filteredData = processedData.filter(req => {
            if (min !== undefined && req.status < min) return false;
            if (max !== undefined && req.status > max) return false;
            return true;
          });
        }
      }

      responseData = data.returnAll ? filteredData : filteredData.slice(-1);
    } else {
      responseData = {
        url: networkData.url || '',
        method: networkData.method || 'GET',
        status: networkData.status || 0,
        statusText: networkData.statusText,
        mimeType: networkData.mimeType || data.mimeType,
        requestHeaders: data.includeHeaders ? networkData.requestHeaders : undefined,
        responseHeaders: data.includeHeaders ? networkData.responseHeaders : undefined,
        requestBody: networkData.requestBody,
        responseBody: networkData.responseBody,
        timestamp: networkData.timestamp || Date.now(),
        duration: networkData.duration,
      };
    }

    console.log('[NetworkCatchBlock] Retrieved network data:', responseData);

    return {
      data: responseData,
    };
  } catch (error) {
    console.error('[NetworkCatchBlock] Error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Failed to fetch network data',
      data: undefined,
    };
  }
}