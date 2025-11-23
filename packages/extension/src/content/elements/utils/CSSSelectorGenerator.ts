/**
 * CSS 셀렉터 생성 유틸리티
 * 요소의 고유한 CSS 셀렉터를 생성합니다
 */
export class CSSSelectorGenerator {
  /**
   * 요소의 안정적인 CSS 셀렉터 생성
   * @param element 대상 요소
   * @returns 생성된 CSS 셀렉터
   */
  static generate(element: Element): string {
    // 1. 속성 기반 셀렉터 (정적 속성들만) - 가장 구체적
    const staticAttributes = ['data-testid', 'aria-label', 'title', 'alt', 'role'];
    for (const attr of staticAttributes) {
      const value = element.getAttribute(attr);
      if (value && !this.isDynamicValue(value)) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }

    // 2. 태그명과 nth-child 조합 (모든 형제 요소 기준)
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;

    if (parent) {
      // 모든 형제 요소 중에서의 위치 (같은 태그명만이 아님)
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;

      if (siblings.length > 1) {
        return `${tagName}:nth-child(${index})`;
      }
    }

    // 3. 부모와 함께 경로 생성
    if (parent) {
      const parentSelector = this.generateParentSelector(parent);
      if (parentSelector) {
        return `${parentSelector} > ${tagName}:nth-child(${Array.from(parent.children).indexOf(element) + 1})`;
      }
    }

    // 4. 마지막 수단: 태그명만
    return tagName;
  }

  /**
   * 부모 요소의 셀렉터 생성
   */
  private static generateParentSelector(parent: Element): string | null {
    const tagName = parent.tagName.toLowerCase();

    // 부모의 속성 기반 셀렉터 시도
    const staticAttributes = ['data-testid', 'aria-label', 'title', 'alt', 'role'];
    for (const attr of staticAttributes) {
      const value = parent.getAttribute(attr);
      if (value && !this.isDynamicValue(value)) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }

    // 부모의 nth-child 시도
    const grandParent = parent.parentElement;
    if (grandParent) {
      const siblings = Array.from(grandParent.children);
      const index = siblings.indexOf(parent) + 1;
      if (siblings.length > 1) {
        return `${tagName}:nth-child(${index})`;
      }
    }

    return tagName;
  }

  /**
   * 동적 값 패턴 감지
   * @param value 확인할 값
   * @returns 동적 값 여부
   */
  private static isDynamicValue(value: string): boolean {
    const dynamicPatterns = [
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
      /^\d{13}$/, // timestamp
      /^[a-zA-Z0-9]{16,}$/, // long random string
      /^[a-zA-Z0-9]+-\d+$/, // name-123 pattern
    ];

    return dynamicPatterns.some((pattern) => pattern.test(value));
  }
}
