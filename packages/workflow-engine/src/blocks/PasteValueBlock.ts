import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, SelectorData } from '../dom';

export interface PasteValueBlock extends Block {
  readonly name: 'paste-value';
  value: string; // 붙여넣을 값
}

export const PasteValueBlockSchema = z.object({
  name: z.literal('paste-value'),
  selector: z.string(),
  findBy: z.enum(['cssSelector', 'xpath']).optional().default('cssSelector'),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional(),
    markEl: z.boolean().optional(),
  }).optional(),
  value: z.string(),
});

export function validatePasteValueBlock(data: unknown): PasteValueBlock {
  return PasteValueBlockSchema.parse(data) as PasteValueBlock;
}

export async function handlerPasteValue(
  data: PasteValueBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', value, findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for paste-value block');
    }

    if (value === undefined || value === null) {
      throw new Error('Value is required for paste-value block');
    }

    const selectorData: SelectorData = { selector, findBy, option: data.option };
    const element = await domProvider.findElement(selectorData);

    if (!element) {
      throw new Error('Element not found for pasting value');
    }

    // 여러 요소가 반환된 경우 첫 번째 요소 사용
    const targetElement = Array.isArray(element) ? element[0] : element;

    if (!targetElement) {
      throw new Error('Target element not found');
    }

    // Check if paste method is available on the DOMProvider
    if (domProvider.paste) {
      // Use DOMProvider's paste method for advanced paste functionality
      await domProvider.paste(value);
    } else {
      // Fallback to direct paste simulation on the element
      console.warn('[PasteValueBlock] Advanced paste not supported in this environment, falling back to direct element manipulation');
      await pasteValueToElementFallback(targetElement as HTMLElement, value);
    }

    return { data: true };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in paste-value handler',
      data: false,
    };
  }
}

/**
 * 요소에 값을 붙여넣기합니다 (fallback method).
 * 실제 사용자 동작과 유사하게 paste 이벤트를 발생시킵니다.
 */
async function pasteValueToElementFallback(element: HTMLElement, value: string): Promise<void> {
  // 1. 요소를 뷰포트에 보이도록 스크롤
  element.scrollIntoView({
    behavior: 'instant',
    block: 'center',
    inline: 'center',
  });

  // 스크롤 완료 대기
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 2. 요소에 포커스
  if (element.focus) {
    element.focus();
  }

  // 3. 요소가 편집 가능한 요소인지 확인하고 처리
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 기존 값 선택 (전체 선택)
    element.select();
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;

    // 4. 선택된 텍스트를 새 값으로 교체 (먼저 값을 설정)
    const currentValue = element.value;
    const newValue = currentValue.substring(0, start) + value + currentValue.substring(end);

    element.value = newValue;
    // 커서 위치 조정
    const newCursorPosition = start + value.length;
    element.setSelectionRange(newCursorPosition, newCursorPosition);

    // Input 이벤트 트리거
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });

    // clipboardData에 붙여넣을 데이터 설정
    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', value);
    }

    element.dispatchEvent(pasteEvent);
  } else if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(value));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // No selection, append to the end
      element.appendChild(document.createTextNode(value));
    }

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });

    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', value);
    }

    element.dispatchEvent(pasteEvent);
  } else {
    // Try setting textContent or innerHTML as last resort
    if ('textContent' in element) {
      element.textContent = value;
    } else if ('innerHTML' in element) {
      (element as any).innerHTML = value;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 50));
}