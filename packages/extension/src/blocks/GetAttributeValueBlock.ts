import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

export interface GetAttributeValueBlock extends Block {
  readonly name: 'attribute-value';
  attributeName: string;
}

export const GetAttributeValueBlockSchema = BaseBlockSchema.extend({
  name: z.literal('attribute-value'),
  attributeName: z.string(),
});

export function validateGetAttributeValueBlock(data: unknown): GetAttributeValueBlock {
  return GetAttributeValueBlockSchema.parse(data);
}

export async function handlerGetAttributeValue(
  data: GetAttributeValueBlock
): Promise<BlockResult<string | string[] | null>> {
  try {
    const { selector = '', attributeName, findBy = 'cssSelector', option } = data;

    if (!selector) {
      throw new Error('Selector is required for attribute-value block');
    }

    if (!attributeName) {
      throw new Error('Attribute name is required for attribute-value block');
    }

    const elements = await findElement({ selector, findBy, option });

    if (!elements) {
      return { data: null };
    }

    const result = Array.isArray(elements)
      ? elements
          .map((element) => element.getAttribute(attributeName))
          .filter((value) => value !== null)
      : elements.getAttribute(attributeName);

    return { data: result };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in attribute-value handler',
      data: null,
    };
  }
}
