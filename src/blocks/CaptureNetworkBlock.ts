import z from 'zod';
import { Block, BlockResult } from './types';

export interface NetworkRequest {
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

export interface CaptureNetworkBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'capture-network';
  targetUrl: string;
  waitForLoadComplete?: boolean; // 페이지 로드 완료 대기 (기본: true)
  timeout?: number; // 타임아웃 (ms, 기본: 30000)
  includeRequestHeaders?: boolean; // 요청 헤더 포함 여부 (기본: false)
  includeResponseHeaders?: boolean; // 응답 헤더 포함 여부 (기본: false)
  includeResponseBody?: boolean; // 응답 본문 포함 여부 (기본: false)
  urlFilter?: string; // URL 필터 (정규식 문자열)
  resourceTypes?: string[]; // 리소스 타입 필터 (예: ['Document', 'XHR', 'Fetch'])
}

export interface CaptureNetworkResult {
  requests: NetworkRequest[];
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    fromCacheCount: number;
  };
}

export const CaptureNetworkBlockSchema = z.object({
  name: z.literal('capture-network'),
  targetUrl: z.string().url(),
  waitForLoadComplete: z.boolean().optional(),
  timeout: z.number().min(0).optional(),
  includeRequestHeaders: z.boolean().optional(),
  includeResponseHeaders: z.boolean().optional(),
  includeResponseBody: z.boolean().optional(),
  urlFilter: z.string().optional(),
  resourceTypes: z.array(z.string()).optional(),
});

export function validateCaptureNetworkBlock(data: unknown): CaptureNetworkBlock {
  return CaptureNetworkBlockSchema.parse(data) as CaptureNetworkBlock;
}

export async function handlerCaptureNetwork(
  data: CaptureNetworkBlock
): Promise<BlockResult<CaptureNetworkResult>> {
  try {
    console.log('[CaptureNetworkBlock] Capturing network requests for URL:', data.targetUrl);

    // Background로 네트워크 캡처 요청 전송
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_CAPTURE_NETWORK',
      data: {
        targetUrl: data.targetUrl,
        waitForLoadComplete: data.waitForLoadComplete ?? true,
        timeout: data.timeout || 30000,
        includeRequestHeaders: data.includeRequestHeaders ?? false,
        includeResponseHeaders: data.includeResponseHeaders ?? false,
        includeResponseBody: data.includeResponseBody ?? false,
        urlFilter: data.urlFilter,
        resourceTypes: data.resourceTypes,
      },
    });

    if (response.$isError) {
      return {
        hasError: true,
        message: response.message || 'Network capture failed',
        data: undefined,
      };
    }

    console.log(
      '[CaptureNetworkBlock] Network capture successful, captured:',
      response.data.summary.totalRequests,
      'requests'
    );
    return {
      data: response.data,
    };
  } catch (error) {
    console.error('[CaptureNetworkBlock] Network capture error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in network capture',
      data: undefined,
    };
  }
}

