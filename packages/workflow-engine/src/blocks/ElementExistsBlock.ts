import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';
import z from 'zod';

export interface ElementExistsBlock extends Block {
  readonly name: 'element-exists';
}

export const ElementExistsBlockSchema = BaseBlockSchema.extend({
  name: z.literal('element-exists'),
});

export function validateElementExistsBlock(data: unknown): ElementExistsBlock {
  return ElementExistsBlockSchema.parse(data);
}

export async function handlerElementExists(
  data: ElementExistsBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean | null>> {
  try {
    const { selector = '', findBy = 'cssSelector', option } = data;

    if (!selector) {
      throw new Error('Selector is required for element-exists block');
    }

    const element = await domProvider.findElement({ selector, findBy, option });
    const exists = element !== null && element !== undefined;

    return { data: exists };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in element-exists handler',
      data: null,
    };
  }
}