import { ElementSelector } from './ElementSelector';
import { SelectorData } from '..';

/**
 * Shadow DOM Selector
 *
 * Shadow DOM은 웹 컴포넌트에서 사용하는 캡슐화된 DOM 구조입니다.
 * 일반 CSS selector로는 Shadow DOM 내부의 요소에 접근할 수 없어서
 * 이 클래스로 Shadow Root를 통해 내부 요소를 찾을 수 있습니다.
 *
 * 사용법:
 * - `>>` 구분자로 Shadow DOM 경계를 나타냄
 * - 예시: "my-component >> .inner-button >> span"
 *   1. my-component 요소 찾기
 *   2. 그 요소의 shadowRoot 내부에서 .inner-button 찾기
 *   3. 그 버튼의 shadowRoot 내부에서 span 찾기
 */
export class ShadowDOMSelector extends ElementSelector {
  async find(
    data: SelectorData,
    documentCtx: Document = document
  ): Promise<Element | Element[] | null> {
    const { selector, option } = data;
    const { multiple = false } = option || {};

    if (!selector || selector.trim() === '') {
      return null;
    }

    const parts = selector.split('>>').map((part) => part.trim());

    let currentContext: Document | ShadowRoot = documentCtx;

    try {
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        // 빈 부분이 있으면 null 반환
        if (!part) {
          return null;
        }

        if (isLast && multiple) {
          return Array.from(currentContext.querySelectorAll(part));
        }

        const element: Element | null = currentContext.querySelector(part);
        if (!element) return null;

        if (isLast) {
          return element;
        }

        if (element.shadowRoot) {
          currentContext = element.shadowRoot;
        } else {
          return null;
        }
      }
    } catch (error) {
      console.error('Shadow DOM Selector error:', error);
      return null;
    }

    return null;
  }
}
