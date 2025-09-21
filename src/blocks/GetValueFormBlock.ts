import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
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
  data: GetValueFormsBlock
): Promise<BlockResult<string | boolean | null>> {
  try {
    const { selector = '', type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for get-value-form block');
    }

    const element = (await findElement({ selector, findBy, option: data.option })) as HTMLElement;

    if (!element) {
      throw new Error('Form element not found');
    }

    const value = getFormValue(element, type);
    return { data: value };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in get-value-form handler',
      data: null,
    };
  }
}

function getFormValue(
  element: HTMLElement,
  type: 'text-field' | 'select' | 'checkbox'
): string | boolean {
  switch (type) {
    case 'text-field':
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return element.value;
      }
      break;
    case 'select':
      if (element instanceof HTMLSelectElement) {
        return element.value;
      }
      break;
    case 'checkbox':
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        return element.checked;
      }
      break;
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
  throw new Error(`Invalid element type for ${type}`);
}
