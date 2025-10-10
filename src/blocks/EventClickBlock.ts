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
  textFilter: z.object({
    text: z.union([z.string(), z.array(z.string())]),
    mode: z.enum(['exact', 'contains', 'startsWith', 'endsWith', 'regex']),
  }).optional(),
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
        const filteredElement = selectElementByText(elements as HTMLElement[], textFilter.text, textFilter.mode);
        if (!filteredElement) {
          const textDisplay = Array.isArray(textFilter.text) ? textFilter.text.join(', ') : textFilter.text;
          throw new Error(`No element found with text filter: "${textDisplay}" (mode: ${textFilter.mode})`);
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

async function simulateClickElement(element: HTMLElement): Promise<void> {
  // 1. Scroll element into view
  element.scrollIntoView({ 
    behavior: 'instant', 
    block: 'center',
    inline: 'center' 
  });
  
  // Small delay to ensure scroll completes
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 2. Focus the element (handles window focus issues)
  if (element.focus) {
    element.focus();
  }
  
  // 3. Get element position for realistic coordinates
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // 4. Dispatch hover events first (mimics real user interaction)
  const hoverEvents = [
    new MouseEvent('mouseenter', { 
      bubbles: true, 
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
    }),
    new MouseEvent('mouseover', { 
      bubbles: true, 
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
    }),
  ];
  
  hoverEvents.forEach(event => element.dispatchEvent(event));
  
  // Small delay between hover and click
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // 5. Dispatch click events with coordinates
  const mouseEvents = [
    new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: centerX,
      clientY: centerY,
      screenX: window.screenX + centerX,
      screenY: window.screenY + centerY,
    }),
    new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: centerX,
      clientY: centerY,
      screenX: window.screenX + centerX,
      screenY: window.screenY + centerY,
    }),
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: centerX,
      clientY: centerY,
      screenX: window.screenX + centerX,
      screenY: window.screenY + centerY,
    }),
  ];

  mouseEvents.forEach((event) => {
    element.dispatchEvent(event);
  });

  // 6. Native click method as fallback
  if (element.click) {
    element.click();
  }
  
  // 7. Small delay to ensure click is processed
  await new Promise(resolve => setTimeout(resolve, 50));
}
