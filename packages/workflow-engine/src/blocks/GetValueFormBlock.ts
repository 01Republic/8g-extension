import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';
import z from 'zod';

export interface GetValueFormsBlock extends Block {
  readonly name: 'get-value-form';
  type?: 'text-field' | 'select' | 'checkbox';
}

export const GetValueFormsBlockSchema = BaseBlockSchema.extend({
  name: z.literal('get-value-form'),
  type: z.enum(['text-field', 'select', 'checkbox']).optional(),
});

export function validateGetValueFormsBlock(data: unknown): GetValueFormsBlock {
  return GetValueFormsBlockSchema.parse(data);
}

export async function handlerGetValueForm(
  data: GetValueFormsBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string | boolean | null>> {
  try {
    const { selector = '', type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for get-value-form block');
    }

    const element = await domProvider.findElement({ selector, findBy, option: data.option });

    if (!element || Array.isArray(element)) {
      throw new Error('Form element not found or multiple elements returned');
    }

    const value = await getFormValue(element, type, domProvider);
    return { data: value };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in get-value-form handler',
      data: null,
    };
  }
}

async function getFormValue(
  element: Element,
  type: 'text-field' | 'select' | 'checkbox',
  domProvider: DOMProvider
): Promise<string | boolean> {
  switch (type) {
    case 'text-field':
    case 'select':
      // Use DOMProvider's getValue method for text inputs and selects
      return await domProvider.getValue(element);
    case 'checkbox':
      // For checkboxes, we need to check the 'checked' attribute
      const checkedValue = await domProvider.getAttribute(element, 'checked');
      return checkedValue !== null && checkedValue !== 'false';
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
}