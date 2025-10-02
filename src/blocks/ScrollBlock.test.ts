import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScrollBlock, handlerScroll } from './ScrollBlock';

describe('handlerScroll 테스트', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container" style="height: 2000px;">
        <div class="scroll-target" style="margin-top: 1000px;">스크롤 대상</div>
      </div>
    `;

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock window scroll functions
    window.scrollTo = vi.fn();
    window.scrollBy = vi.fn();
  });

  const baseData: ScrollBlock = {
    name: 'scroll',
    selector: '',
    findBy: 'cssSelector',
    option: {},
  };

  describe('toElement 스크롤', () => {
    it('요소로 스크롤', async () => {
      const data = {
        ...baseData,
        selector: '.scroll-target',
        scrollType: 'toElement' as const,
      };
      const result = await handlerScroll(data);

      expect(result.data).toBe(true);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('요소가 없으면 에러', async () => {
      const data = {
        ...baseData,
        selector: '.non-existent',
        scrollType: 'toElement' as const,
      };
      const result = await handlerScroll(data);

      expect(result.hasError).toBe(true);
      expect(result.data).toBe(false);
    });

    it('selector 없으면 에러', async () => {
      const data = {
        ...baseData,
        scrollType: 'toElement' as const,
      };
      const result = await handlerScroll(data);

      expect(result.hasError).toBe(true);
      expect(result.message).toContain('Selector is required');
    });
  });

  describe('byDistance 스크롤', () => {
    it('지정된 거리만큼 스크롤', async () => {
      const data = {
        ...baseData,
        scrollType: 'byDistance' as const,
        distance: 300,
      };
      const result = await handlerScroll(data);

      expect(result.data).toBe(true);
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: 300,
        behavior: 'smooth',
      });
    });

    it('기본 거리 500px', async () => {
      const data = {
        ...baseData,
        scrollType: 'byDistance' as const,
      };
      const result = await handlerScroll(data);

      expect(result.data).toBe(true);
      expect(window.scrollBy).toHaveBeenCalledWith({
        top: 500,
        behavior: 'smooth',
      });
    });
  });

  describe('toBottom 스크롤', () => {
    it('페이지 끝까지 스크롤', async () => {
      const data = {
        ...baseData,
        scrollType: 'toBottom' as const,
      };
      
      // Mock scrollHeight to simulate reaching bottom
      Object.defineProperty(document.body, 'scrollHeight', {
        writable: true,
        value: 2000,
      });

      const result = await handlerScroll(data);

      expect(result.data).toBe(true);
      expect(window.scrollTo).toHaveBeenCalled();
    });
  });

  describe('untilLoaded 스크롤', () => {
    it('콘텐츠 로드될 때까지 스크롤', async () => {
      const data = {
        ...baseData,
        scrollType: 'untilLoaded' as const,
        maxScrolls: 5,
      };

      Object.defineProperty(document.body, 'scrollHeight', {
        writable: true,
        value: 2000,
      });

      const result = await handlerScroll(data);

      expect(result.data).toBe(true);
    });
  });
});

