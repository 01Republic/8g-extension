import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
import z from 'zod';

export interface SetContentEditableBlock extends Block {
  readonly name: 'set-contenteditable';
  setValue: string;
}

export const SetContentEditableBlockSchema = BaseBlockSchema.extend({
  name: z.literal('set-contenteditable'),
  setValue: z.string(),
});

export function validateSetContentEditableBlock(data: unknown): SetContentEditableBlock {
  return SetContentEditableBlockSchema.parse(data);
}

export async function handlerSetContentEditable(
  data: SetContentEditableBlock
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', setValue, findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for set-contenteditable block');
    }

    const element = (await findElement({
      selector,
      findBy,
      option: data.option,
    })) as HTMLElement | null;

    if (!element) {
      throw new Error('Contenteditable element not found');
    }

    if (!isContentEditable(element)) {
      throw new Error('Target element is not contenteditable');
    }

    setContentEditableValue(element, setValue);

    return { data: 'Contenteditable element updated successfully' };
  } catch (error) {
    return {
      hasError: true,
      message:
        error instanceof Error ? error.message : 'Unknown error in set-contenteditable handler',
      data: null,
    };
  }
}

function isContentEditable(element: HTMLElement): boolean {
  return element.isContentEditable || element.getAttribute('contenteditable') === 'true';
}

function setContentEditableValue(element: HTMLElement, value: string): void {
  element.textContent = value;

  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: 'insertText',
    })
  );

  element.dispatchEvent(new Event('change', { bubbles: true }));
}
