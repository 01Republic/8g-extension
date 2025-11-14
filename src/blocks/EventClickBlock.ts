import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

export interface EventClickBlock extends Block {
  readonly name: 'event-click';
  // 텍스트 기반 요소 선택 옵션
  textFilter?: {
    text: string | string[];
    mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  };
}

export const EventClickBlockSchema = BaseBlockSchema.extend({
  name: z.literal('event-click'),
  textFilter: z
    .object({
      text: z.union([z.string(), z.array(z.string())]),
      mode: z.enum(['exact', 'contains', 'startsWith', 'endsWith', 'regex']),
    })
    .optional(),
});

export function validateEventClickBlock(data: unknown): EventClickBlock {
  return EventClickBlockSchema.parse(data);
}

export async function handlerEventClick(data: EventClickBlock): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', findBy = 'cssSelector', option, textFilter } = data;

    if (!selector) {
      throw new Error('Selector is required for event-click block');
    }

    const elements = await findElement({ selector, findBy, option });

    if (!elements) {
      throw new Error('Element not found for clicking');
    }

    let targetElement: HTMLElement;

    if (Array.isArray(elements)) {
      // 여러 요소가 찾아진 경우
      if (textFilter) {
        // 텍스트 필터로 요소 선택
        const filteredElement = selectElementByText(
          elements as HTMLElement[],
          textFilter.text,
          textFilter.mode
        );
        if (!filteredElement) {
          const textDisplay = Array.isArray(textFilter.text)
            ? textFilter.text.join(', ')
            : textFilter.text;
          throw new Error(
            `No element found with text filter: "${textDisplay}" (mode: ${textFilter.mode})`
          );
        }
        targetElement = filteredElement;
      } else {
        // 첫 번째 요소 선택
        targetElement = elements[0] as HTMLElement;
      }
    } else {
      // 단일 요소
      targetElement = elements as HTMLElement;
    }

    await simulateClickElement(targetElement);

    return { data: true };
  } catch (error) {
    console.log(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in event-click handler',
      data: false,
    };
  }
}

function selectElementByText(
  elements: HTMLElement[],
  textFilter: string | string[],
  mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
): HTMLElement | null {
  for (const element of elements) {
    const text = getElementText(element);

    // 텍스트 필터가 배열인 경우 각 텍스트에 대해 확인
    const textsToCheck = Array.isArray(textFilter) ? textFilter : [textFilter];

    for (const filterText of textsToCheck) {
      let matches = false;

      switch (mode) {
        case 'exact':
          matches = text === filterText;
          break;
        case 'contains':
          matches = text.includes(filterText);
          break;
        case 'startsWith':
          matches = text.startsWith(filterText);
          break;
        case 'endsWith':
          matches = text.endsWith(filterText);
          break;
        case 'regex':
          try {
            const regex = new RegExp(filterText);
            matches = regex.test(text);
          } catch (error) {
            console.warn('Invalid regex pattern:', filterText);
            continue;
          }
          break;
      }

      if (matches) {
        return element;
      }
    }
  }

  return null;
}

function getElementText(element: HTMLElement): string {
  // innerText를 우선 사용 (사용자가 보는 텍스트)
  if (element.innerText) {
    return element.innerText.trim();
  }

  // textContent 대체 사용
  if (element.textContent) {
    return element.textContent.trim();
  }

  // input 요소의 경우 value 사용
  if (element instanceof HTMLInputElement && element.value) {
    return element.value.trim();
  }

  // placeholder나 title 속성 사용
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) {
    return placeholder.trim();
  }

  const title = element.getAttribute('title');
  if (title) {
    return title.trim();
  }

  // aria-label 사용
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  return '';
}

/**
 * 요소에 click 이벤트를 발생시킵니다.
 * CDP 클릭은 좌표 기반이므로 특정 요소의 이벤트 리스너를 트리거하기 위해 필요합니다.
 */
function dispatchClickEvent(element: HTMLElement): void {
  // MouseEvent를 사용하여 실제 클릭과 유사한 이벤트 발생
  const mouseDownEvent = new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0, // left button
  });

  const mouseUpEvent = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0, // left button
  });

  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0, // left button
  });

  // 이벤트 발생 순서: mousedown -> mouseup -> click
  element.dispatchEvent(mouseDownEvent);
  element.dispatchEvent(mouseUpEvent);
  element.dispatchEvent(clickEvent);
}

async function simulateClickElement(element: HTMLElement): Promise<void> {
  // 1. Scroll element into view
  element.scrollIntoView({
    behavior: 'instant',
    block: 'center',
    inline: 'center',
  });

  // Small delay to ensure scroll completes
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 2. Focus the element (handles window focus issues)
  if (element.focus) {
    element.focus();
  }

  // 3. Get element position for realistic coordinates
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 4. Use CDP to click via background service (isTrusted: true)
  // Note: tabId will be automatically detected by background service from sender.tab.id
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CDP_CLICK',
      data: {
        x: centerX,
        y: centerY,
      },
    });

    if (response && !response.$isError) {
      console.log('[EventClick] CDP click successful:', response);
      // CDP 클릭 후 요소에 대한 click 이벤트를 수동으로 발생시켜야 함
      // CDP는 좌표 기반이므로 특정 요소의 이벤트 리스너가 트리거되지 않을 수 있음
      dispatchClickEvent(element);
    } else {
      throw new Error(response?.message || 'CDP click failed');
    }
  } catch (error) {
    console.error('[EventClick] CDP click failed, falling back to native MouseEvent dispatch:', error);

    // Fallback: Use native MouseEvent dispatch (isTrusted: false but works)
    dispatchClickEvent(element);
  }

  // 5. Small delay to ensure click is processed
  await new Promise((resolve) => setTimeout(resolve, 50));
}
