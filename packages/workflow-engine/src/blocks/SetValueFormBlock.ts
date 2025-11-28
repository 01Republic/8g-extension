import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';
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
  data: SetValueFormsBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', setValue, type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for set-value-form block');
    }

    const element = await domProvider.findElement({ selector, findBy, option: data.option });

    if (!element || Array.isArray(element)) {
      throw new Error('Form element not found or multiple elements returned');
    }

    await setFormValue(element, setValue, type, domProvider);
    return { data: 'Form element updated successfully' };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in set-value-form handler',
      data: null,
    };
  }
}

async function setFormValue(
  element: Element,
  value: string,
  type: 'text-field' | 'select' | 'checkbox',
  domProvider: DOMProvider
): Promise<void> {
  switch (type) {
    case 'text-field':
    case 'select':
      // Use DOMProvider's setValue method for text inputs and selects
      await domProvider.setValue(element, value);
      break;
    case 'checkbox':
      // For checkboxes, we need to handle the checked state
      // Since DOMProvider doesn't have a specific method for this,
      // we'll need to extend it or handle it through setValue
      const checkedValue = value === 'true' || value === 'checked' || value === '1';
      await domProvider.setValue(element, checkedValue ? 'true' : 'false');
      break;
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
}