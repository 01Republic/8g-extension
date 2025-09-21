/**
 * XPath 생성 유틸리티
 * 요소의 전체 XPath를 생성합니다
 */
export class XPathGenerator {
  /**
   * 요소의 XPath 생성
   * @param element 대상 요소
   * @returns 생성된 XPath
   */
  static generate(element: Element): string {

    // 전체 경로를 따라가며 XPath 생성
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      // 같은 태그명의 형제 요소가 있는 경우 인덱스 추가
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(sibling => sibling.tagName === current!.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `[${index}]`;
      }

      // 속성이 있는 경우 추가
      const attributes = this.getStableAttributes(current);
      if (attributes.length > 0) {
        selector += `[@${attributes.join(' and @')}]`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return '/' + path.join('/');
  }

  /**
   * 요소의 안정적인 속성들을 반환
   * @param element 대상 요소
   * @returns 안정적인 속성 배열
   */
  private static getStableAttributes(element: Element): string[] {
    const stableAttributes: string[] = [];
    
    // 안정적인 속성들 (동적이지 않은 것들)
    const stableAttrs = ['data-testid', 'aria-label', 'title', 'alt', 'role'];
    
    for (const attr of stableAttrs) {
      const value = element.getAttribute(attr);
      if (value && !this.isDynamicValue(value)) {
        stableAttributes.push(`${attr}="${value}"`);
      }
    }

    return stableAttributes;
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
      /^[a-zA-Z0-9]+_[a-zA-Z0-9]+$/, // underscore pattern
    ];
    
    return dynamicPatterns.some(pattern => pattern.test(value));
  }
}
