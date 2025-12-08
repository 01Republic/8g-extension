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

export async function handlerPasteValue(data: PasteValueBlock): Promise<BlockResult<boolean>> {
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
 * CDP를 사용하여 요소에 값을 붙여넣기합니다.
 * CDP의 Input.insertText를 사용하여 실제 키보드 입력처럼 텍스트를 삽입합니다.
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

  // 3. 요소가 편집 가능한 요소인지 확인하고 전체 선택
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 기존 값 전체 선택
    element.select();
  } else if (element.isContentEditable) {
    // contentEditable 요소의 경우 전체 선택
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  await new Promise((resolve) => setTimeout(resolve, 30));

  // 4. CDP를 사용하여 텍스트 삽입
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_INSERT_TEXT',
      data: { text: value },
    });

    if (response?.$isError) {
      throw new Error(response.message || 'CDP insert text failed');
    }
  } catch (error) {
    // CDP 실패 시 fallback으로 기존 방식 사용
    console.warn('[PasteValueBlock] CDP insert text failed, using fallback:', error);
    await fallbackPasteValue(element, value);
  }

  await new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * CDP 실패 시 사용하는 fallback 붙여넣기 방식
 */
async function fallbackPasteValue(element: HTMLElement, value: string): Promise<void> {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const currentValue = element.value;
    const newValue = currentValue.substring(0, start) + value + currentValue.substring(end);

    element.value = newValue;
    const newCursorPosition = start + value.length;
    element.setSelectionRange(newCursorPosition, newCursorPosition);

    // input 이벤트 발생
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
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

    // input 이벤트 발생
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }));
  }
}
