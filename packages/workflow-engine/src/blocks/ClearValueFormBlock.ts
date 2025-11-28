import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';
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
  data: ClearValueFormsBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', type = 'text-field', findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for clear-value-form block');
    }

    const element = await domProvider.findElement({ selector, findBy, option: data.option });

    if (!element || Array.isArray(element)) {
      throw new Error('Form element not found or multiple elements returned');
    }

    await clearFormValue(element, type, domProvider);
    return { data: 'Form element cleared successfully' };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in clear-value-form handler',
      data: null,
    };
  }
}

async function clearFormValue(
  element: Element, 
  type: 'text-field' | 'select' | 'checkbox',
  domProvider: DOMProvider
): Promise<void> {
  switch (type) {
    case 'text-field':
      // Clear text input by setting empty value
      await domProvider.setValue(element, '');
      break;
    case 'select':
      // For select elements, set to the first option (index 0) or empty value
      await domProvider.setValue(element, '');
      break;
    case 'checkbox':
      // For checkboxes, uncheck them
      await domProvider.setValue(element, 'false');
      break;
    default:
      throw new Error(`Unsupported form element type: ${type}`);
  }
}