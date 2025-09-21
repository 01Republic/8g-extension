import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
import z from 'zod';

export interface SetValueFormsBlock extends Block {
  readonly name: 'set-value-form';
  setValue: string;
  type?: 'text-field' | 'select' | 'checkbox';
}

export const SetValueFormsBlockSchema = BaseBlockSchema.extend({
  name: z.literal('set-value-form'),
  setValue: z.string(),
  type: z.enum(['text-field', 'select', 'checkbox']).optional(),
});

export function validateSetValueFormsBlock(data: unknown): SetValueFormsBlock {
  return SetValueFormsBlockSchema.parse(data);
}

export async function handlerSetValueForm(
  data: SetValueFormsBlock
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', setValue, type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for set-value-form block');
    }

    const element = (await findElement({ selector, findBy, option: data.option })) as HTMLElement;

    if (!element) {
      throw new Error('Form element not found');
    }

    setFormValue(element, setValue, type);
    return { data: 'Form element updated successfully' };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in set-value-form handler',
      data: null,
    };
  }
}

function setFormValue(
  element: HTMLElement,
  value: string,
  type: 'text-field' | 'select' | 'checkbox'
): void {
  switch (type) {
    case 'text-field':
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = value;

        // Trigger input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'select':
      if (element instanceof HTMLSelectElement) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    case 'checkbox':
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        element.checked = value === 'true' || value === 'checked';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
}
