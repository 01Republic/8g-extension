import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

export interface MarkBorderBlock extends Block {
  readonly name: 'mark-border';
  // 테두리 스타일 옵션
  borderStyle?: {
    color?: string; // 테두리 색상 (기본값: '#9b59b6' - 보라색)
    width?: number; // 테두리 두께 (기본값: 3)
    style?: 'solid' | 'dashed' | 'dotted' | 'double'; // 테두리 스타일 (기본값: 'solid')
    animated?: boolean; // 깜박임 애니메이션 활성화 (기본값: true)
  };
  // 텍스트 기반 요소 선택 옵션
  textFilter?: {
    text: string | string[];
    mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  };
}

export const MarkBorderBlockSchema = BaseBlockSchema.extend({
  name: z.literal('mark-border'),
  borderStyle: z
    .object({
      color: z.string().optional(),
      width: z.number().optional(),
      style: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
      animated: z.boolean().optional(),
    })
    .optional(),
  textFilter: z
    .object({
      text: z.union([z.string(), z.array(z.string())]),
      mode: z.enum(['exact', 'contains', 'startsWith', 'endsWith', 'regex']),
    })
    .optional(),
});

export function validateMarkBorderBlock(data: unknown): MarkBorderBlock {
  return MarkBorderBlockSchema.parse(data);
}

export async function handlerMarkBorder(data: MarkBorderBlock): Promise<BlockResult<boolean>> {
  try {
    const { selector = '', findBy = 'cssSelector', option, borderStyle, textFilter } = data;

    if (!selector) {
      throw new Error('Selector is required for mark-border block');
    }

    const elements = await findElement({ selector, findBy, option });

    if (!elements) {
      throw new Error('Element not found for marking border');
    }

    let targetElements: HTMLElement[];

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
        targetElements = [filteredElement];
      } else {
        // 모든 요소에 테두리 추가
        targetElements = elements as HTMLElement[];
      }
    } else {
      // 단일 요소
      targetElements = [elements as HTMLElement];
    }

    // 테두리 스타일 설정
    const color = borderStyle?.color || '#9b59b6'; // 보라색 계열
    const width = borderStyle?.width || 3;
    const style = borderStyle?.style || 'solid';
    const animated = borderStyle?.animated !== false; // 기본값: true

    // 각 요소에 테두리 추가
    for (const element of targetElements) {
      applyBorderToElement(element, color, width, style, animated);
    }

    return { data: true };
  } catch (error) {
    console.log(error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in mark-border handler',
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
 * 요소에 테두리를 추가합니다.
 * 기존 스타일을 보존하면서 테두리만 추가합니다.
 * 깜박임 애니메이션을 지원합니다.
 */
function applyBorderToElement(
  element: HTMLElement,
  color: string,
  width: number,
  style: 'solid' | 'dashed' | 'dotted' | 'double',
  animated: boolean = true
): void {
  // 요소를 뷰포트에 보이도록 스크롤
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });

  // 기존 스타일 보존
  const originalBorder = element.style.border;
  const originalOutline = element.style.outline;
  const originalZIndex = element.style.zIndex;
  const originalPosition = element.style.position;
  const originalAnimation = element.style.animation;

  // 깜박임 애니메이션 스타일 추가 (한 번만)
  if (animated && !document.getElementById('mark-border-animation-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'mark-border-animation-style';
    styleElement.textContent = `
      @keyframes mark-border-blink {
        0%, 100% {
          border-color: ${color};
        }
        50% {
          border-color: transparent;
        }
      }
      [data-mark-border-animated="true"] {
        animation: mark-border-blink 1s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // 테두리 스타일 적용
  element.style.border = `${width}px ${style} ${color}`;
  element.style.outline = 'none'; // outline 제거하여 border만 표시
  element.style.zIndex = originalZIndex || '999999';

  // position이 static인 경우 relative로 변경하여 z-index가 적용되도록 함
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }

  // 애니메이션 적용
  if (animated) {
    element.setAttribute('data-mark-border-animated', 'true');
  }

  // 데이터 속성으로 원본 스타일 저장 (나중에 제거할 수 있도록)
  element.setAttribute('data-mark-border-original-border', originalBorder);
  element.setAttribute('data-mark-border-original-outline', originalOutline);
  element.setAttribute('data-mark-border-original-z-index', originalZIndex);
  element.setAttribute('data-mark-border-original-position', originalPosition);
  element.setAttribute('data-mark-border-original-animation', originalAnimation);
  element.setAttribute('data-mark-border-applied', 'true');
}
