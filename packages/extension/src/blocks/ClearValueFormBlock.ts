import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
import z from 'zod';

export interface ClearValueFormsBlock extends Block {
  readonly name: 'clear-value-form';
  type?: 'text-field' | 'select' | 'checkbox';
}

export const ClearValueFormsBlockSchema = BaseBlockSchema.extend({
  name: z.literal('clear-value-form'),
  type: z.enum(['text-field', 'select', 'checkbox']).optional(),
});

export function validateClearValueFormsBlock(data: unknown): ClearValueFormsBlock {
  return ClearValueFormsBlockSchema.parse(data);
}

export async function handlerClearValueForm(
  data: ClearValueFormsBlock
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for clear-value-form block');
    }

    const element = (await findElement({ selector, findBy, option: data.option })) as HTMLElement;

    if (!element) {
      throw new Error('Form element not found');
    }

    clearFormValue(element, type);
    return { data: 'Form element cleared successfully' };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in clear-value-form handler',
      data: null,
    };
  }
}

function clearFormValue(element: HTMLElement, type: 'text-field' | 'select' | 'checkbox'): void {
  switch (type) {
    case 'text-field':
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'select':
      if (element instanceof HTMLSelectElement) {
        element.selectedIndex = 0;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'checkbox':
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        element.checked = false;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
}
