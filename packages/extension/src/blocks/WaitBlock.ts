import z from 'zod';
import { Block, BlockResult } from './types';

export interface WaitBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'wait';
  duration: number; // 대기 시간 (밀리초)
}

export const WaitBlockSchema = z.object({
  name: z.literal('wait'),
  duration: z.number().min(0),
});

export function validateWaitBlock(data: unknown): WaitBlock {
  return WaitBlockSchema.parse(data);
}

export async function handlerWait(data: WaitBlock): Promise<BlockResult<boolean>> {
  try {
    const { duration } = data;

    console.log(`[Wait] Waiting for ${duration}ms...`);

    await new Promise((resolve) => setTimeout(resolve, duration));

    console.log(`[Wait] Wait completed after ${duration}ms`);

    return { data: true };
  } catch (error) {
    console.log(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in wait handler',
      data: false,
    };
  }
}
