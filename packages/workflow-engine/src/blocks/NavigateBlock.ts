import z from 'zod';
import { Block, BlockResult } from './types';
import { DOMProvider } from '../dom/DOMProvider';

/**
 * NavigateBlock - 특정 URL로 페이지 이동
 *
 * 현재 탭에서 지정한 URL로 이동합니다.
 */
export interface NavigateBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'navigate';
  url: string; // 이동할 URL
  waitForLoad?: boolean; // 페이지 로드 완료 대기 (기본값: true)
  timeout?: number; // 로드 대기 timeout (기본값: 30000ms)
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
export async function handlerNavigate(
  data: NavigateBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  try {
    const { url, waitForLoad = true, timeout = 30000 } = data;

    console.log(`[Navigate] Navigating to: ${url}`);

    // Use DOMProvider's navigate method
    await domProvider.navigate(url);

    console.log(`[Navigate] Navigation completed: ${url}`);
    return { data: true };
  } catch (error) {
    console.error('[Navigate] Error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in navigate handler',
      data: false,
    };
  }
}