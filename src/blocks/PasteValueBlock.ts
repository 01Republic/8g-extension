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
  console.log('[PasteValue] === 시작 ===');
  console.log('[PasteValue] 붙여넣을 값:', value);
  console.log('[PasteValue] 요소 타입:', element.constructor.name);
  console.log('[PasteValue] 요소:', element);

  // 1. 요소를 뷰포트에 보이도록 스크롤
  console.log('[PasteValue] 1. 스크롤 시작');
  element.scrollIntoView({
    behavior: 'instant',
    block: 'center',
    inline: 'center',
  });

  // 스크롤 완료 대기
  await new Promise((resolve) => setTimeout(resolve, 50));
  console.log('[PasteValue] 1. 스크롤 완료');

  // 2. 요소에 포커스
  console.log('[PasteValue] 2. 포커스 설정');
  if (element.focus) {
    element.focus();
  }
  console.log('[PasteValue] 2. 포커스 완료');

  // 3. 요소가 편집 가능한 요소인지 확인하고 처리
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    console.log('[PasteValue] 3. Input/Textarea 요소 처리 시작');
    
    // 기존 값 확인
    const beforeValue = element.value;
    console.log('[PasteValue] 3-1. 기존 값:', beforeValue);
    console.log('[PasteValue] 3-1. 기존 값 길이:', beforeValue.length);

    // 기존 값 선택 (전체 선택)
    element.select();
    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    console.log('[PasteValue] 3-2. 선택 범위: start=', start, 'end=', end);

    // 4. 선택된 텍스트를 새 값으로 교체 (먼저 값을 설정)
    const currentValue = element.value;
    const newValue = currentValue.substring(0, start) + value + currentValue.substring(end);
    console.log('[PasteValue] 3-3. 새 값 계산:', newValue);
    console.log('[PasteValue] 3-3. 새 값 길이:', newValue.length);
    
    console.log('[PasteValue] 3-4. 값 설정 전 - element.value:', element.value);
    element.value = newValue;
    console.log('[PasteValue] 3-4. 값 설정 후 - element.value:', element.value);
    console.log('[PasteValue] 3-4. 값 설정 후 - element.value 길이:', element.value.length);

    // 커서 위치 조정
    const newCursorPosition = start + value.length;
    element.setSelectionRange(newCursorPosition, newCursorPosition);
    console.log('[PasteValue] 3-5. 커서 위치 설정:', newCursorPosition);

    // 5. ClipboardEvent를 사용하여 paste 이벤트 발생 (값 설정 후 알림용)
    console.log('[PasteValue] 3-6. paste 이벤트 생성 시작');
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });

    // clipboardData에 붙여넣을 데이터 설정
    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', value);
      console.log('[PasteValue] 3-6. clipboardData 설정 완료:', pasteEvent.clipboardData.getData('text/plain'));
    }

    // paste 이벤트 발생 전 값 확인
    console.log('[PasteValue] 3-7. paste 이벤트 발생 전 - element.value:', element.value);
    const pasteDispatched = element.dispatchEvent(pasteEvent);
    console.log('[PasteValue] 3-7. paste 이벤트 발생 후 - dispatched:', pasteDispatched);
    console.log('[PasteValue] 3-7. paste 이벤트 발생 후 - element.value:', element.value);
    console.log('[PasteValue] 3-7. paste 이벤트 발생 후 - element.value 길이:', element.value.length);

    // 6. input과 change 이벤트 발생
    console.log('[PasteValue] 3-8. input 이벤트 발생 전 - element.value:', element.value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('[PasteValue] 3-8. input 이벤트 발생 후 - element.value:', element.value);
    
    console.log('[PasteValue] 3-9. change 이벤트 발생 전 - element.value:', element.value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[PasteValue] 3-9. change 이벤트 발생 후 - element.value:', element.value);
    console.log('[PasteValue] 3-9. change 이벤트 발생 후 - element.value 길이:', element.value.length);
  } else if (element.isContentEditable) {
    console.log('[PasteValue] 3. ContentEditable 요소 처리 시작');
    const beforeContent = element.textContent || element.innerText;
    console.log('[PasteValue] 3-1. 기존 내용:', beforeContent);
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      console.log('[PasteValue] 3-2. 선택 범위가 있음');
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(value));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      console.log('[PasteValue] 3-2. 값 삽입 후 내용:', element.textContent || element.innerText);
    } else {
      console.log('[PasteValue] 3-2. 선택 범위 없음, 전체 교체');
      element.textContent = value;
      console.log('[PasteValue] 3-2. 값 설정 후 내용:', element.textContent);
    }

    // paste 이벤트 발생 (값 설정 후 알림용)
    console.log('[PasteValue] 3-3. paste 이벤트 생성');
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer(),
    });

    if (pasteEvent.clipboardData) {
      pasteEvent.clipboardData.setData('text/plain', value);
    }

    console.log('[PasteValue] 3-4. paste 이벤트 발생 전 내용:', element.textContent || element.innerText);
    element.dispatchEvent(pasteEvent);
    console.log('[PasteValue] 3-4. paste 이벤트 발생 후 내용:', element.textContent || element.innerText);
    
    console.log('[PasteValue] 3-5. input 이벤트 발생');
    element.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('[PasteValue] 3-5. input 이벤트 발생 후 내용:', element.textContent || element.innerText);
  } else {
    console.log('[PasteValue] 3. 일반 요소 처리 시작');
    console.log('[PasteValue] 3-1. 요소:', element);
    
    // 일반 요소인 경우 value 속성이나 textContent 사용
    if ('value' in element && typeof (element as any).value === 'string') {
      const beforeValue = (element as any).value;
      console.log('[PasteValue] 3-2. value 속성 있음, 기존 값:', beforeValue);
      (element as any).value = value;
      console.log('[PasteValue] 3-2. 값 설정 후:', (element as any).value);
      
      console.log('[PasteValue] 3-3. input 이벤트 발생');
      element.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[PasteValue] 3-4. change 이벤트 발생');
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      const beforeText = element.textContent;
      console.log('[PasteValue] 3-2. textContent 사용, 기존 내용:', beforeText);
      element.textContent = value;
      console.log('[PasteValue] 3-2. 값 설정 후:', element.textContent);
      
      console.log('[PasteValue] 3-3. input 이벤트 발생');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // 6. 처리 완료 대기
  console.log('[PasteValue] 4. 최종 대기 시작');
  await new Promise((resolve) => setTimeout(resolve, 50));
  
  // 최종 값 확인
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    console.log('[PasteValue] === 완료 === 최종 element.value:', element.value);
    console.log('[PasteValue] === 완료 === 최종 element.value 길이:', element.value.length);
  } else if (element.isContentEditable) {
    console.log('[PasteValue] === 완료 === 최종 내용:', element.textContent || element.innerText);
  } else {
    if ('value' in element) {
      console.log('[PasteValue] === 완료 === 최종 value:', (element as any).value);
    } else {
      console.log('[PasteValue] === 완료 === 최종 textContent:', element.textContent);
    }
  }
}

