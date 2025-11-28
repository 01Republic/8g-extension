import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, SelectorData } from '../dom';

export interface SetContentEditableBlock extends Block {
  readonly name: 'set-contenteditable';
  setValue: string;
  editable?: boolean; // Whether to make element editable (default: true)
}

export const SetContentEditableBlockSchema = z.object({
  name: z.literal('set-contenteditable'),
  selector: z.string(),
  findBy: z.enum(['cssSelector', 'xpath']).optional().default('cssSelector'),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional(),
    markEl: z.boolean().optional(),
  }).optional(),
  setValue: z.string(),
  editable: z.boolean().optional().default(true),
});

export function validateSetContentEditableBlock(data: unknown): SetContentEditableBlock {
  return SetContentEditableBlockSchema.parse(data) as SetContentEditableBlock;
}

export async function handlerSetContentEditable(
  data: SetContentEditableBlock,
  domProvider: DOMProvider
): Promise<BlockResult<string | null>> {
  try {
    const { selector = '', setValue, findBy = 'cssSelector', editable = true } = data;

    if (!selector) {
      throw new Error('Selector is required for set-contenteditable block');
    }

    const selectorData: SelectorData = { selector, findBy, option: data.option };
    const element = await domProvider.findElement(selectorData);

    if (!element) {
      throw new Error('Contenteditable element not found');
    }

    const targetElement = Array.isArray(element) ? element[0] : element;

    if (!targetElement) {
      throw new Error('Target element not found');
    }

    // Check if setContentEditable method is available on the DOMProvider
    if (domProvider.setContentEditable) {
      // Use DOMProvider's setContentEditable method for advanced functionality
      await domProvider.setContentEditable(targetElement, editable);
    } else {
      // Fallback to direct element manipulation
      console.warn('[SetContentEditableBlock] Advanced content editable control not supported in this environment, falling back to direct manipulation');
      setContentEditableFallback(targetElement as HTMLElement, editable);
    }

    // Set the value if provided and element is editable
    if (setValue && (editable || isContentEditable(targetElement as HTMLElement))) {
      setContentEditableValue(targetElement as HTMLElement, setValue);
    }

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

// Fallback function to set contenteditable attribute
function setContentEditableFallback(element: HTMLElement, editable: boolean): void {
  if (editable) {
    element.setAttribute('contenteditable', 'true');
    // Ensure element can receive focus
    if (!element.hasAttribute('tabindex') && element.tabIndex < 0) {
      element.setAttribute('tabindex', '0');
    }
  } else {
    element.setAttribute('contenteditable', 'false');
    // Remove tabindex if it was added by us
    if (element.getAttribute('tabindex') === '0') {
      element.removeAttribute('tabindex');
    }
  }
}

function isContentEditable(element: HTMLElement): boolean {
  return element.isContentEditable || element.getAttribute('contenteditable') === 'true';
}

function setContentEditableValue(element: HTMLElement, value: string): void {
  // Clear existing content first
  element.textContent = '';
  
  // Set new value
  element.textContent = value;

  // Trigger events to simulate user interaction
  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: 'insertText',
    })
  );

  element.dispatchEvent(new Event('change', { bubbles: true }));

  // Also trigger focus events if the element is editable
  if (isContentEditable(element)) {
    element.focus();
    
    // Move cursor to end of content
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false); // Collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}