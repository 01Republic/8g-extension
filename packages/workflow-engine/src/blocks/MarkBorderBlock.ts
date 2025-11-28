import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, SelectorData, BorderOptions } from '../dom';

export interface MarkBorderBlock extends Block {
  readonly name: 'mark-border';
  // 강조 모드 선택
  highlightMode?: 'border' | 'spotlight' | 'both'; // 기본값: 'border'
  // 테두리 스타일 옵션
  borderStyle?: {
    color?: string; // 테두리 색상 (기본값: '#3b82f6' - 파란색)
    width?: number; // 테두리 두께 (기본값: 3)
    style?: 'solid' | 'dashed' | 'dotted' | 'double'; // 테두리 스타일 (기본값: 'solid')
    animated?: boolean; // 깜박임 애니메이션 활성화 (기본값: true)
  };
  // 스팟라이트 옵션 (highlightMode가 'spotlight' 또는 'both'일 때 사용)
  spotlightOptions?: {
    overlayOpacity?: number; // 오버레이 투명도 (기본: 0.4 - 살짝 검은색 배경)
    showPointer?: boolean; // 포인터 아이콘 표시 (기본: true)
    pointerPosition?: 'top' | 'right' | 'bottom' | 'left'; // 포인터 위치 (기본: 'top')
    showLabel?: boolean; // 라벨 표시 (기본: false)
    label?: string; // 라벨 텍스트
    description?: string; // 설명 텍스트
    pulseColor?: string; // 펄스 색상 (기본: borderStyle.color 또는 '#3b82f6' - 파란색)
    borderRadius?: number; // 모서리 둥글기 (기본: 8)
  };
  // 텍스트 기반 요소 선택 옵션
  textFilter?: {
    text: string | string[];
    mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  };
  // 임시 표시 옵션
  temporary?: boolean; // 임시 표시 여부 (기본: false)
  duration?: number; // 표시 지속 시간 (ms, temporary: true일 때만)
}

export const MarkBorderBlockSchema = z.object({
  name: z.literal('mark-border'),
  selector: z.string(),
  findBy: z.enum(['cssSelector', 'xpath']).optional().default('cssSelector'),
  option: z.object({
    waitForSelector: z.boolean().optional(),
    waitSelectorTimeout: z.number().optional(),
    multiple: z.boolean().optional(),
    markEl: z.boolean().optional(),
  }).optional(),
  highlightMode: z.enum(['border', 'spotlight', 'both']).optional().default('border'),
  borderStyle: z
    .object({
      color: z.string().optional(),
      width: z.number().optional(),
      style: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
      animated: z.boolean().optional(),
    })
    .optional(),
  spotlightOptions: z
    .object({
      overlayOpacity: z.number().optional(),
      showPointer: z.boolean().optional(),
      pointerPosition: z.enum(['top', 'right', 'bottom', 'left']).optional(),
      showLabel: z.boolean().optional(),
      label: z.string().optional(),
      description: z.string().optional(),
      pulseColor: z.string().optional(),
      borderRadius: z.number().optional(),
    })
    .optional(),
  textFilter: z
    .object({
      text: z.union([z.string(), z.array(z.string())]),
      mode: z.enum(['exact', 'contains', 'startsWith', 'endsWith', 'regex']),
    })
    .optional(),
  temporary: z.boolean().optional().default(false),
  duration: z.number().min(0).optional(),
});

export function validateMarkBorderBlock(data: unknown): MarkBorderBlock {
  return MarkBorderBlockSchema.parse(data) as MarkBorderBlock;
}

export async function handlerMarkBorder(
  data: MarkBorderBlock,
  domProvider: DOMProvider
): Promise<BlockResult<boolean>> {
  try {
    const {
      selector = '',
      findBy = 'cssSelector',
      option,
      highlightMode = 'border',
      borderStyle,
      spotlightOptions,
      textFilter,
      temporary = false,
      duration,
    } = data;

    if (!selector) {
      throw new Error('Selector is required for mark-border block');
    }

    const selectorData: SelectorData = { selector, findBy, option };
    const elements = await domProvider.findElement(selectorData);

    if (!elements) {
      throw new Error('Element not found for marking border');
    }

    let targetElements: Element[];

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
        targetElements = elements as Element[];
      }
    } else {
      // 단일 요소
      targetElements = [elements as Element];
    }

    // Check if markBorder method is available on the DOMProvider
    if (domProvider.markBorder) {
      // Use DOMProvider's advanced markBorder method
      for (const element of targetElements) {
        const borderOptions: BorderOptions = {
          color: borderStyle?.color || '#3b82f6',
          width: borderStyle?.width || 3,
          style: borderStyle?.style || 'solid',
          temporary,
          duration,
        };

        await domProvider.markBorder(element, borderOptions);
      }
    } else {
      // Fallback to simple border application
      console.warn('[MarkBorderBlock] Advanced border marking not supported in this environment, falling back to simple border');
      
      // 테두리 스타일 설정
      const color = borderStyle?.color || '#3b82f6';
      const width = borderStyle?.width || 3;
      const style = borderStyle?.style || 'solid';
      const animated = borderStyle?.animated !== false;

      // highlightMode에 따라 처리
      for (const element of targetElements) {
        if (highlightMode === 'border' || highlightMode === 'both') {
          applyBorderToElementFallback(element as HTMLElement, color, width, style, animated, temporary, duration);
        }

        if (highlightMode === 'spotlight' || highlightMode === 'both') {
          // Note: Spotlight mode requires more complex implementation that would be best handled by the DOMProvider
          console.warn('[MarkBorderBlock] Spotlight mode not supported in fallback implementation');
        }
      }
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

// Fallback function for simple border application
function applyBorderToElementFallback(
  element: HTMLElement,
  color: string,
  width: number,
  style: 'solid' | 'dashed' | 'dotted' | 'double',
  animated: boolean = true,
  temporary: boolean = false,
  duration?: number
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
    // 깜박임 애니메이션 스타일 추가 (한 번만)
    if (!document.getElementById('mark-border-animation-style')) {
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
    element.setAttribute('data-mark-border-animated', 'true');
  }

  // 데이터 속성으로 원본 스타일 저장 (나중에 제거할 수 있도록)
  element.setAttribute('data-mark-border-original-border', originalBorder);
  element.setAttribute('data-mark-border-original-outline', originalOutline);
  element.setAttribute('data-mark-border-original-z-index', originalZIndex);
  element.setAttribute('data-mark-border-original-position', originalPosition);
  element.setAttribute('data-mark-border-applied', 'true');

  // 임시 표시 처리
  if (temporary && duration) {
    setTimeout(() => {
      removeBorderFromElement(element);
    }, duration);
  }
}

// Helper function to remove border styling
function removeBorderFromElement(element: HTMLElement): void {
  const originalBorder = element.getAttribute('data-mark-border-original-border');
  const originalOutline = element.getAttribute('data-mark-border-original-outline');
  const originalZIndex = element.getAttribute('data-mark-border-original-z-index');
  const originalPosition = element.getAttribute('data-mark-border-original-position');

  // 원본 스타일 복원
  element.style.border = originalBorder || '';
  element.style.outline = originalOutline || '';
  element.style.zIndex = originalZIndex || '';
  element.style.position = originalPosition || '';

  // 데이터 속성 제거
  element.removeAttribute('data-mark-border-animated');
  element.removeAttribute('data-mark-border-original-border');
  element.removeAttribute('data-mark-border-original-outline');
  element.removeAttribute('data-mark-border-original-z-index');
  element.removeAttribute('data-mark-border-original-position');
  element.removeAttribute('data-mark-border-applied');
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