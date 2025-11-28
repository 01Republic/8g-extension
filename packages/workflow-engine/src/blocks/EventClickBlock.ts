import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { DOMProvider } from '../dom/DOMProvider';

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

export async function handlerEventClick(
  data: EventClickBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', findBy = 'cssSelector', option, textFilter } = data;

    if (!selector) {
      throw new Error('Selector is required for event-click block');
    }

    const elements = await domProvider.findElement({ selector, findBy, option });

    if (!elements) {
      throw new Error('Element not found for clicking');
    }

    let targetElement: Element;

    if (Array.isArray(elements)) {
      // 여러 요소가 찾아진 경우
      if (textFilter) {
        // 텍스트 필터로 요소 선택
        const filteredElement = await selectElementByText(
          elements,
          textFilter.text,
          textFilter.mode,
          domProvider
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
        targetElement = elements[0];
      }
    } else {
      // 단일 요소
      targetElement = elements;
    }

    await domProvider.click(targetElement);

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

async function selectElementByText(
  elements: Element[],
  textFilter: string | string[],
  mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex',
  domProvider: DOMProvider
): Promise<Element | null> {
  for (const element of elements) {
    const text = await getElementText(element, domProvider);

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

async function getElementText(element: Element, domProvider: DOMProvider): Promise<string> {
  // Use DOMProvider's getText method first
  let text = await domProvider.getText(element);
  
  if (text.trim()) {
    return text.trim();
  }

  // If no text, check for input value
  const value = await domProvider.getValue(element).catch(() => '');
  if (value.trim()) {
    return value.trim();
  }

  // Check for common attributes
  const placeholder = await domProvider.getAttribute(element, 'placeholder').catch(() => '');
  if (placeholder?.trim()) {
    return placeholder.trim();
  }

  const title = await domProvider.getAttribute(element, 'title').catch(() => '');
  if (title?.trim()) {
    return title.trim();
  }

  const ariaLabel = await domProvider.getAttribute(element, 'aria-label').catch(() => '');
  if (ariaLabel?.trim()) {
    return ariaLabel.trim();
  }

  return '';
}