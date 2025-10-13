import z from 'zod';
import { Block, BlockResult } from './types';

export interface FetchApiBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'fetch-api';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: Record<string, any>; // JSON 객체
  timeout?: number; // 요청 타임아웃 (ms, 기본: 30000)
  parseJson?: boolean; // 응답을 JSON으로 파싱할지 여부 (기본: true)
  returnHeaders?: boolean; // 응답 헤더도 반환할지 여부 (기본: false)
}

export interface FetchApiResponse {
  status: number;
  statusText: string;
  data: any; // 파싱된 JSON 또는 텍스트
  headers?: Record<string, string>; // returnHeaders: true일 때만
}

export const FetchApiBlockSchema = z.object({
  name: z.literal('fetch-api'),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.any()).optional(),
  timeout: z.number().min(0).optional(),
  parseJson: z.boolean().optional(),
  returnHeaders: z.boolean().optional(),
});

export function validateFetchApiBlock(data: unknown): FetchApiBlock {
  return FetchApiBlockSchema.parse(data) as FetchApiBlock;
}

export async function handlerFetchApi(data: FetchApiBlock): Promise<BlockResult<FetchApiResponse>> {
  try {
    console.log('[FetchApiBlock] Sending API request to background:', data.url);

    // Background로 API 요청 전송
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_API',
      data: {
        url: data.url,
        method: data.method || 'GET',
        headers: data.headers || {},
        body: data.body,
        timeout: data.timeout || 30000,
        parseJson: data.parseJson ?? true, // 기본값 true
        returnHeaders: data.returnHeaders ?? false,
      },
    });

    if (response.$isError) {
      return {
        hasError: true,
        message: response.message || 'API request failed',
        data: undefined,
      };
    }

    console.log('[FetchApiBlock] API request successful');
    return {
      data: response.data,
    };
  } catch (error) {
    console.error('[FetchApiBlock] API request error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in API request',
      data: undefined,
    };
  }
}

