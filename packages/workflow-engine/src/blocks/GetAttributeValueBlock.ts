import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';

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
  data: GetAttributeValueBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string | string[] | null>> {
  try {
    const { selector = '', attributeName, findBy = 'cssSelector', option } = data;

    if (!selector) {
      throw new Error('Selector is required for attribute-value block');
    }

    if (!attributeName) {
      throw new Error('Attribute name is required for attribute-value block');
    }

    const elements = await domProvider.findElement({ selector, findBy, option });

    if (!elements) {
      return { data: null };
    }

    if (Array.isArray(elements)) {
      const results = await Promise.all(
        elements.map(async (element) => {
          const value = await domProvider.getAttribute(element, attributeName);
          return value;
        })
      );
      // Filter out null values
      const filteredResults = results.filter((value) => value !== null);
      return { data: filteredResults };
    } else {
      const result = await domProvider.getAttribute(elements, attributeName);
      return { data: result };
    }
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in attribute-value handler',
      data: null,
    };
  }
}