import z from 'zod';
import { Block, BlockResult } from './types';

/**
 * NavigateBlock - 특정 URL로 페이지 이동
 *
 * 현재 탭에서 지정한 URL로 이동합니다.
 */
export interface NavigateBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'navigate';
  url: string;                    // 이동할 URL
  waitForLoad?: boolean;          // 페이지 로드 완료 대기 (기본값: true)
  timeout?: number;               // 로드 대기 timeout (기본값: 30000ms)
}

export const NavigateBlockSchema = z.object({
  name: z.literal('navigate'),
  url: z.string().url('Valid URL is required'),
  waitForLoad: z.boolean().optional(),
  timeout: z.number().min(0).optional(),
});

export function validateNavigateBlock(data: unknown): NavigateBlock {
  return NavigateBlockSchema.parse(data);
}

/**
 * navigate block 핸들러
 * URL로 이동하고 선택적으로 페이지 로드 대기
 */
export async function handlerNavigate(data: NavigateBlock): Promise<BlockResult<boolean>> {
  try {
    const { url, waitForLoad = true, timeout = 30000 } = data;

    console.log(`[Navigate] Navigating to: ${url}`);

    if (waitForLoad) {
      // 페이지 로드 완료 대기
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Navigation timeout after ${timeout}ms`));
        }, timeout);

        // load 이벤트 리스너
        const handleLoad = () => {
          clearTimeout(timeoutId);
          window.removeEventListener('load', handleLoad);
          console.log(`[Navigate] Page loaded: ${url}`);
          resolve({ data: true });
        };

        // 페이지가 이미 로드된 경우를 위한 체크
        if (document.readyState === 'complete') {
          clearTimeout(timeoutId);
          console.log(`[Navigate] Page already loaded: ${url}`);
          resolve({ data: true });
        } else {
          window.addEventListener('load', handleLoad);
        }

        // URL 변경
        window.location.href = url;
      });
    } else {
      // 로드 대기 없이 바로 이동
      window.location.href = url;
      console.log(`[Navigate] Navigation initiated (no wait): ${url}`);
      return { data: true };
    }
  } catch (error) {
    console.error('[Navigate] Error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in navigate handler',
      data: false,
    };
  }
}
