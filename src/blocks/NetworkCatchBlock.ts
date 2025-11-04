import z from 'zod';
import { Block, BlockResult } from './types';

export interface NetworkCatchBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'network-catch';
  urlPattern?: string; // URL 패턴 (정규식 또는 문자열 포함)
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  status?: number | { min?: number; max?: number }; // 특정 상태 코드 또는 범위
  mimeType?: string; // MIME 타입 필터 (예: 'application/json')
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
  status: z.union([
    z.number(),
    z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
  ]).optional(),
  mimeType: z.string().optional(),
  waitForRequest: z.boolean().optional(),
  waitTimeout: z.number().min(0).optional(),
  returnAll: z.boolean().optional(),
  includeHeaders: z.boolean().optional(),
});

export function validateNetworkCatchBlock(data: unknown): NetworkCatchBlock {
  return NetworkCatchBlockSchema.parse(data) as NetworkCatchBlock;
}

export async function handlerNetworkCatch(data: NetworkCatchBlock): Promise<BlockResult<NetworkCatchResponse | NetworkCatchResponse[]>> {
  try {
    console.log('[NetworkCatchBlock] Fetching network requests with pattern:', data.urlPattern);

    // Background로 네트워크 데이터 요청
    const response = await chrome.runtime.sendMessage({
      type: 'NETWORK_CATCH',
      data: {
        urlPattern: data.urlPattern,
        method: data.method,
        status: data.status,
        mimeType: data.mimeType,
        waitForRequest: data.waitForRequest || false,
        waitTimeout: data.waitTimeout || 5000,
        returnAll: data.returnAll || false,
        includeHeaders: data.includeHeaders || false,
      },
    });

    if (response.$isError) {
      return {
        hasError: true,
        message: response.message || 'Failed to fetch network data',
        data: undefined,
      };
    }

    console.log('[NetworkCatchBlock] Retrieved network data:', response.data);

    return {
      data: response.data,
    };
  } catch (error) {
    console.error('[NetworkCatchBlock] Error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Failed to fetch network data'
    };
  }
}