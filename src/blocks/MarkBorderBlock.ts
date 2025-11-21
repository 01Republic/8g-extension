import z from 'zod';
import { Block, BlockResult, BaseBlockSchema } from './types';
import { findElement } from '@/content/elements';

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
}

export const MarkBorderBlockSchema = BaseBlockSchema.extend({
  name: z.literal('mark-border'),
  highlightMode: z.enum(['border', 'spotlight', 'both']).optional(),
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
});

export function validateMarkBorderBlock(data: unknown): MarkBorderBlock {
  return MarkBorderBlockSchema.parse(data);
}

export async function handlerMarkBorder(data: MarkBorderBlock): Promise<BlockResult<boolean>> {
  try {
    const {
      selector = '',
      findBy = 'cssSelector',
      option,
      highlightMode = 'border',
      borderStyle,
      spotlightOptions,
      textFilter,
    } = data;

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
    const color = borderStyle?.color || '#3b82f6'; // 파란색 계열 (blue-500)
    const width = borderStyle?.width || 3;
    const style = borderStyle?.style || 'solid';
    const animated = borderStyle?.animated !== false; // 기본값: true

    // highlightMode에 따라 처리
    for (const element of targetElements) {
      if (highlightMode === 'border' || highlightMode === 'both') {
        applyBorderToElement(element, color, width, style, animated);
      }

      if (highlightMode === 'spotlight' || highlightMode === 'both') {
        applySpotlightToElement(element, {
          color: spotlightOptions?.pulseColor || color,
          overlayOpacity: spotlightOptions?.overlayOpacity ?? 0.4, // 더 투명하게 조정
          showPointer: spotlightOptions?.showPointer !== false,
          pointerPosition: spotlightOptions?.pointerPosition || 'top',
          showLabel: spotlightOptions?.showLabel || false,
          label: spotlightOptions?.label,
          description: spotlightOptions?.description,
          borderRadius: spotlightOptions?.borderRadius || 8,
        });
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

/**
 * 스팟라이트 옵션 타입
 */
interface SpotlightOptions {
  color: string;
  overlayOpacity: number;
  showPointer: boolean;
  pointerPosition: 'top' | 'right' | 'bottom' | 'left';
  showLabel: boolean;
  label?: string;
  description?: string;
  borderRadius: number;
}

/**
 * 요소에 스팟라이트 효과를 적용합니다.
 * 어두운 오버레이와 SVG 마스크를 사용하여 요소만 강조합니다.
 */
function applySpotlightToElement(element: HTMLElement, options: SpotlightOptions): void {
  // 요소를 뷰포트에 보이도록 스크롤
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
  });

  // 기존 오버레이가 있으면 제거
  const existingOverlay = document.getElementById('8g-spotlight-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // 요소의 위치와 크기 계산
  const rect = element.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  const x = rect.left + scrollX;
  const y = rect.top + scrollY;
  const width = rect.width;
  const height = rect.height;

  // 오버레이 컨테이너 생성
  const overlay = createOverlay(x, y, width, height, options);
  document.body.appendChild(overlay);

  // 스크롤 및 리사이즈 이벤트 리스너 추가
  const updatePosition = () => {
    // 오버레이가 여전히 DOM에 있는지 확인
    if (!document.body.contains(overlay)) {
      return;
    }

    const newRect = element.getBoundingClientRect();
    const newScrollX = window.scrollX || window.pageXOffset;
    const newScrollY = window.scrollY || window.pageYOffset;

    const newX = newRect.left + newScrollX;
    const newY = newRect.top + newScrollY;
    const newWidth = newRect.width;
    const newHeight = newRect.height;

    updateOverlayPosition(overlay, newX, newY, newWidth, newHeight, options);
  };

  // 이벤트 리스너 등록
  const scrollHandler = updatePosition;
  const resizeHandler = updatePosition;
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('resize', resizeHandler, { passive: true });

  // 오버레이에 이벤트 핸들러 참조 저장 (나중에 제거할 수 있도록)
  (overlay as any).__8g_scrollHandler = scrollHandler;
  (overlay as any).__8g_resizeHandler = resizeHandler;

  // 데이터 속성으로 추적 (나중에 제거할 수 있도록)
  element.setAttribute('data-spotlight-applied', 'true');
  overlay.setAttribute('data-spotlight-target-id', getOrCreateElementId(element));
}

/**
 * 오버레이 컨테이너를 생성합니다.
 */
function createOverlay(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpotlightOptions
): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = '8g-spotlight-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
    pointer-events: none;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  // z-index: 9998은 ExecutionStatusUI(2147483647)보다 낮아서 UI를 가리지 않음

  // 어두운 배경
  const background = document.createElement('div');
  background.style.cssText = `
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, ${options.overlayOpacity});
    pointer-events: auto;
  `;
  overlay.appendChild(background);

  // SVG 마스크로 스팟라이트 효과
  const svg = createSpotlightMask(
    x,
    y,
    width,
    height,
    options.borderRadius,
    options.overlayOpacity
  );
  overlay.appendChild(svg);

  // 펄스 애니메이션 링
  const pulseContainer = createPulseRings(x, y, width, height, options);
  overlay.appendChild(pulseContainer);

  // 포인터 아이콘
  if (options.showPointer) {
    const pointer = createPointerIcon(x, y, width, height, options);
    overlay.appendChild(pointer);
  }

  // 라벨 툴팁
  if (options.showLabel && (options.label || options.description)) {
    const label = createLabelTooltip(x, y, width, height, options);
    overlay.appendChild(label);
  }

  return overlay;
}

/**
 * SVG 마스크를 사용하여 스팟라이트 효과를 생성합니다.
 */
function createSpotlightMask(
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number,
  overlayOpacity: number
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.id = '8g-spotlight-mask';

  // 전체 화면을 흰색으로 채움
  const whiteRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  whiteRect.setAttribute('x', '0');
  whiteRect.setAttribute('y', '0');
  whiteRect.setAttribute('width', '100%');
  whiteRect.setAttribute('height', '100%');
  whiteRect.setAttribute('fill', 'white');

  // 요소 영역을 검은색으로 채움 (구멍 뚫기)
  const blackRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  blackRect.setAttribute('x', String(x - scrollX - 4));
  blackRect.setAttribute('y', String(y - scrollY - 4));
  blackRect.setAttribute('width', String(width + 8));
  blackRect.setAttribute('height', String(height + 8));
  blackRect.setAttribute('rx', String(borderRadius));
  blackRect.setAttribute('fill', 'black');

  mask.appendChild(whiteRect);
  mask.appendChild(blackRect);
  defs.appendChild(mask);

  // 마스크를 적용한 오버레이
  const overlayRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  overlayRect.setAttribute('x', '0');
  overlayRect.setAttribute('y', '0');
  overlayRect.setAttribute('width', '100%');
  overlayRect.setAttribute('height', '100%');
  overlayRect.setAttribute('fill', 'black');
  overlayRect.setAttribute('fill-opacity', String(overlayOpacity));
  overlayRect.setAttribute('mask', 'url(#8g-spotlight-mask)');

  svg.appendChild(defs);
  svg.appendChild(overlayRect);

  return svg;
}

/**
 * 펄스 애니메이션 링을 생성합니다.
 */
function createPulseRings(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpotlightOptions
): HTMLElement {
  const container = document.createElement('div');
  container.className = '8g-spotlight-pulse-container';
  container.style.cssText = `
    position: absolute;
    pointer-events: none;
  `;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  container.style.left = `${x - scrollX - 4}px`;
  container.style.top = `${y - scrollY - 4}px`;
  container.style.width = `${width + 8}px`;
  container.style.height = `${height + 8}px`;
  container.style.borderRadius = `${options.borderRadius}px`;

  // 펄스 애니메이션 스타일 추가 (한 번만)
  if (!document.getElementById('8g-spotlight-pulse-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = '8g-spotlight-pulse-style';
    styleElement.textContent = `
      @keyframes 8g-spotlight-ping {
        75%, 100% {
          opacity: 0;
          transform: scale(1.1);
        }
      }
      .8g-spotlight-pulse-ring {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        animation: 8g-spotlight-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // 펄스 링 1
  const ring1 = document.createElement('div');
  ring1.className = '8g-spotlight-pulse-ring';
  ring1.style.cssText = `
    box-shadow: 0 0 0 4px ${options.color};
    opacity: 0.75;
  `;
  container.appendChild(ring1);

  // 펄스 링 2
  const ring2 = document.createElement('div');
  ring2.className = '8g-spotlight-pulse-ring';
  ring2.style.cssText = `
    box-shadow: 0 0 0 4px ${options.color};
    opacity: 0.5;
    animation-delay: 0.5s;
  `;
  container.appendChild(ring2);

  // 고정 테두리
  const border = document.createElement('div');
  border.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: 0 0 0 3px ${options.color}, 0 0 20px ${options.color};
  `;
  container.appendChild(border);

  return container;
}

/**
 * 포인터 아이콘을 생성합니다.
 */
function createPointerIcon(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpotlightOptions
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    pointer-events: none;
  `;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // 포인터 위치 계산
  const positions = {
    top: {
      left: x - scrollX + width / 2,
      top: y - scrollY - 48,
      rotation: 180,
    },
    right: {
      left: x - scrollX + width + 48,
      top: y - scrollY + height / 2,
      rotation: -90,
    },
    bottom: {
      left: x - scrollX + width / 2,
      top: y - scrollY + height + 48,
      rotation: 0,
    },
    left: {
      left: x - scrollX - 48,
      top: y - scrollY + height / 2,
      rotation: 90,
    },
  };

  const pos = positions[options.pointerPosition];
  container.style.left = `${pos.left}px`;
  container.style.top = `${pos.top}px`;
  container.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;

  // 포인터 아이콘 SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.style.cssText = `
    color: ${options.color};
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  `;

  // 포인터 경로 (마우스 클릭 아이콘 - Lucide MousePointerClick 스타일)
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M11.5 11.5l6.88 6.88a1 1 0 0 1-.7 1.7H15l-3-3-3 3H3.32a1 1 0 0 1-.7-1.7l6.88-6.88L11.5 11.5z'
  );
  svg.appendChild(path);

  // 포인터 본체
  const pointerBody = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pointerBody.setAttribute('d', 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z');
  svg.insertBefore(pointerBody, path);

  // 애니메이션 스타일 추가
  if (!document.getElementById('8g-spotlight-pointer-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = '8g-spotlight-pointer-style';
    styleElement.textContent = `
      @keyframes 8g-spotlight-pointer-bounce {
        0%, 100% {
          transform: translate(-50%, -50%) rotate(var(--pointer-rotation, 0deg)) translateY(0);
        }
        50% {
          transform: translate(-50%, -50%) rotate(var(--pointer-rotation, 0deg)) translateY(-8px);
        }
      }
      #8g-spotlight-pointer {
        animation: 8g-spotlight-pointer-bounce 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }

  container.id = '8g-spotlight-pointer';
  container.style.setProperty('--pointer-rotation', `${pos.rotation}deg`);
  container.appendChild(svg);

  return container;
}

/**
 * 라벨 툴팁을 생성합니다.
 */
function createLabelTooltip(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpotlightOptions
): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('data-spotlight-label', 'true');
  container.style.cssText = `
    position: absolute;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  `;

  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // 라벨 위치 계산
  const padding = 16;
  const positions = {
    top: {
      left: x - scrollX + width / 2,
      top: y - scrollY - 80,
      transform: 'translate(-50%, 0)',
    },
    right: {
      left: x - scrollX + width + padding,
      top: y - scrollY + height / 2,
      transform: 'translate(0, -50%)',
    },
    bottom: {
      left: x - scrollX + width / 2,
      top: y - scrollY + height + 80,
      transform: 'translate(-50%, 0)',
    },
    left: {
      left: x - scrollX - padding,
      top: y - scrollY + height / 2,
      transform: 'translate(-100%, -50%)',
    },
  };

  const pos = positions[options.pointerPosition];
  container.style.left = `${pos.left}px`;
  container.style.top = `${pos.top}px`;
  container.style.transform = pos.transform;

  // 툴팁 박스
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 12px 16px;
    max-width: 320px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  if (options.label) {
    const label = document.createElement('p');
    label.textContent = options.label;
    label.style.cssText = `
      margin: 0;
      color: #111827;
      font-size: 14px;
      font-weight: 500;
    `;
    tooltip.appendChild(label);
  }

  if (options.description) {
    const desc = document.createElement('p');
    desc.textContent = options.description;
    desc.style.cssText = `
      margin: ${options.label ? '4px 0 0 0' : '0'};
      color: #4b5563;
      font-size: 12px;
    `;
    tooltip.appendChild(desc);
  }

  container.appendChild(tooltip);

  // 페이드인 애니메이션
  setTimeout(() => {
    container.style.opacity = '1';
  }, 200);

  return container;
}

/**
 * 오버레이 위치를 업데이트합니다.
 */
function updateOverlayPosition(
  overlay: HTMLElement,
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpotlightOptions
): void {
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  // SVG 마스크 업데이트
  const svg = overlay.querySelector('svg');
  if (svg) {
    const mask = svg.querySelector('#8g-spotlight-mask');
    if (mask) {
      const blackRect = mask.querySelector('rect:last-child');
      if (blackRect) {
        blackRect.setAttribute('x', String(x - scrollX - 4));
        blackRect.setAttribute('y', String(y - scrollY - 4));
        blackRect.setAttribute('width', String(width + 8));
        blackRect.setAttribute('height', String(height + 8));
      }
    }
  }

  // 펄스 링 위치 업데이트
  const pulseContainer = overlay.querySelector('.8g-spotlight-pulse-container') as HTMLElement;
  if (pulseContainer) {
    pulseContainer.style.left = `${x - scrollX - 4}px`;
    pulseContainer.style.top = `${y - scrollY - 4}px`;
    pulseContainer.style.width = `${width + 8}px`;
    pulseContainer.style.height = `${height + 8}px`;
  }

  // 포인터 위치 업데이트
  const pointer = overlay.querySelector('#8g-spotlight-pointer') as HTMLElement;
  if (pointer) {
    const positions = {
      top: {
        left: x - scrollX + width / 2,
        top: y - scrollY - 48,
      },
      right: {
        left: x - scrollX + width + 48,
        top: y - scrollY + height / 2,
      },
      bottom: {
        left: x - scrollX + width / 2,
        top: y - scrollY + height + 48,
      },
      left: {
        left: x - scrollX - 48,
        top: y - scrollY + height / 2,
      },
    };
    const pos = positions[options.pointerPosition];
    pointer.style.left = `${pos.left}px`;
    pointer.style.top = `${pos.top}px`;
  }

  // 라벨 위치 업데이트
  const label = overlay.querySelector('[data-spotlight-label]') as HTMLElement;
  if (label) {
    const padding = 16;
    const positions = {
      top: {
        left: x - scrollX + width / 2,
        top: y - scrollY - 80,
      },
      right: {
        left: x - scrollX + width + padding,
        top: y - scrollY + height / 2,
      },
      bottom: {
        left: x - scrollX + width / 2,
        top: y - scrollY + height + 80,
      },
      left: {
        left: x - scrollX - padding,
        top: y - scrollY + height / 2,
      },
    };
    const pos = positions[options.pointerPosition];
    label.style.left = `${pos.left}px`;
    label.style.top = `${pos.top}px`;
  }
}

/**
 * 요소에 고유 ID를 부여하거나 기존 ID를 반환합니다.
 */
function getOrCreateElementId(element: HTMLElement): string {
  let id = element.getAttribute('data-8g-spotlight-id');
  if (!id) {
    id = `8g-spotlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('data-8g-spotlight-id', id);
  }
  return id;
}
