import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider } from '../dom';

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

export async function handlerFetchApi(
  data: FetchApiBlock,
  domProvider: DOMProvider
): Promise<BlockResult<FetchApiResponse>> {
  try {
    console.log('[FetchApiBlock] Sending API request:', data.url);

    // Check if fetch method is available on the DOMProvider
    if (!domProvider.fetch) {
      return {
        hasError: true,
        message: 'Fetch API is not supported in this environment',
        data: undefined,
      };
    }

    // Use DOMProvider's fetch method instead of chrome.runtime.sendMessage
    const response = await domProvider.fetch({
      url: data.url,
      method: data.method || 'GET',
      headers: data.headers || {},
      body: data.body,
      timeout: data.timeout || 30000,
    });

    // Parse response based on parseJson setting
    let responseData: any;
    if (data.parseJson ?? true) {
      try {
        responseData = await response.json();
      } catch (error) {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // Build response object
    const fetchApiResponse: FetchApiResponse = {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    };

    // Include headers if requested
    if (data.returnHeaders) {
      fetchApiResponse.headers = {};
      response.headers.forEach((value, key) => {
        fetchApiResponse.headers![key] = value;
      });
    }

    console.log('[FetchApiBlock] API request successful');
    return {
      data: fetchApiResponse,
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