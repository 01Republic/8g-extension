import { findElement } from '@/content/elements';
import { Block, BlockResult, BaseBlockSchema } from './types';
import z from 'zod';

export interface PasteValueBlock extends Block {
  readonly name: 'paste-value';
  value: string; // 붙여넣을 값
}

export const PasteValueBlockSchema = BaseBlockSchema.extend({
  name: z.literal('paste-value'),
  value: z.string(),
});

export function validatePasteValueBlock(data: unknown): PasteValueBlock {
  return PasteValueBlockSchema.parse(data);
}

export async function handlerPasteValue(
  data: PasteValueBlock
): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', value, findBy = 'cssSelector' } = data;

    if (!selector) {
      throw new Error('Selector is required for paste-value block');
    }

    if (value === undefined || value === null) {
      throw new Error('Value is required for paste-value block');
    }

    const element = (await findElement({ selector, findBy, option: data.option })) as HTMLElement;

    if (!element) {
      throw new Error('Element not found for pasting value');
    }

    // 여러 요소가 반환된 경우 첫 번째 요소 사용
    const targetElement = Array.isArray(element) ? element[0] : element;

    if (!targetElement) {
      throw new Error('Target element not found');
    }

    await pasteValueToElement(targetElement as HTMLElement, value);

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
 * 요소에 값을 붙여넣기합니다.
 * 실제 사용자 동작과 유사하게 paste 이벤트를 발생시킵니다.
 */
async function pasteValueToElement(element: HTMLElement, value: string): Promise<void> {
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
  }

  await new Promise((resolve) => setTimeout(resolve, 50));
}

