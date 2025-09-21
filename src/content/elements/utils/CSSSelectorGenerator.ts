/**
 * CSS 셀렉터 생성 유틸리티
 * 요소의 고유한 CSS 셀렉터를 생성합니다 (동적 ID/클래스 제외)
 */
export class CSSSelectorGenerator {
  /**
   * 요소의 안정적인 CSS 셀렉터 생성
   * @param element 대상 요소
   * @returns 생성된 CSS 셀렉터
   */
  static generate(element: Element): string {
    // 1. 태그명과 nth-child 조합 (가장 안정적)
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName.toLowerCase() === tagName
      );
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        return `${tagName}:nth-child(${index})`;
      }
    }

    // 2. 속성 기반 셀렉터 (정적 속성들만)
    const staticAttributes = ['data-testid', 'aria-label', 'title', 'alt', 'role'];
    for (const attr of staticAttributes) {
      const value = element.getAttribute(attr);
      if (value && !this.isDynamicValue(value)) {
        return `[${attr}="${CSS.escape(value)}"]`;
      }
    }

    // 3. 마지막 수단: 태그명만
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
    
    return dynamicPatterns.some(pattern => pattern.test(value));
  }
}
