import { describe, it, expect, beforeEach } from 'vitest';
import { CssSelector } from './CssSelector';
import { SelectorData } from '..';

describe('CssSelector 테스트', () => {
  let cssSelector: CssSelector;
  let mockDocument: Document;

  beforeEach(() => {
    cssSelector = new CssSelector();

    // Create a mock document with JSDOM
    document.body.innerHTML = `
      <div id="test-container">
        <button class="btn primary">Click me</button>
        <span class="text">Hello World</span>
        <a href="/link" class="link">Link text</a>
        <div class="nested">
          <p>Nested content</p>
        </div>
      </div>
    `;
    mockDocument = document;
  });

  const baseData: SelectorData = {
    selector: '',
    findBy: 'cssSelector',
  };

  describe('find 메서드', () => {
    it('CSS 선택자로 요소 찾기', async () => {
      const data = { ...baseData, selector: '.btn' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).className).toBe('btn primary');
    });

    it('요소 못 찾으면 null 반환', async () => {
      const data = { ...baseData, selector: '.non-existent' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('ID로 요소 찾기', async () => {
      const data = { ...baseData, selector: '#test-container' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).id).toBe('test-container');
    });

    it('잘못된 선택자는 에러 안내고 null 반환', async () => {
      const data = { ...baseData, selector: '>>><invalid' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('커스텀 pseudo-selector들', () => {
    it(':contains() pseudo-selector', async () => {
      const data = { ...baseData, selector: ':contains("Hello World")' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Hello World');
    });

    it(':equal() pseudo-selector', async () => {
      const data = { ...baseData, selector: ':equal("Hello World")' };
      const result = await cssSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Hello World');
    });

    it('커스텀 pseudo-selector 쓸 때 요소들에 텍스트 속성 마킹', async () => {
      const data = { ...baseData, selector: ':contains("Hello")' };
      await cssSelector.find(data, mockDocument);

      const spanElement = mockDocument.querySelector('.text');
      expect(spanElement?.getAttribute('data-contains')).toBe('Hello World');
      expect(spanElement?.getAttribute('data-equal')).toBe('Hello World');
    });

    it('일반 선택자 쓸 때는 마킹 안함', async () => {
      const data = { ...baseData, selector: '.text' };
      await cssSelector.find(data, mockDocument);

      const spanElement = mockDocument.querySelector('.text');
      expect(spanElement?.getAttribute('data-contains')).toBe(null);
      expect(spanElement?.getAttribute('data-equal')).toBe(null);
    });
  });

  describe('waitForElement 메서드', () => {
    it('요소 나타날 때까지 기다리기', async () => {
      const data = { ...baseData, selector: '.delayed-element' };

      setTimeout(() => {
        document.body.innerHTML += '<div class="delayed-element">Delayed content</div>';
      }, 200);

      const result = await cssSelector.waitForElement(data, mockDocument, 1000);

      expect(result).toBeTruthy();
      expect((result as Element).className).toBe('delayed-element');
    });

    it('요소 안 나타나면 타임아웃으로 null 반환', async () => {
      const data = { ...baseData, selector: '.never-appears' };

      const result = await cssSelector.waitForElement(data, mockDocument, 100);

      expect(result).toBe(null);
    });

    it('요소 이미 있으면 바로 반환', async () => {
      const data = { ...baseData, selector: '.btn' };

      const startTime = Date.now();
      const result = await cssSelector.waitForElement(data, mockDocument, 1000);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should return almost immediately
    });
  });

  describe('markElementsWithText 메서드', () => {
    it('텍스트 있는 모든 요소들 마킹', async () => {
      const data = { ...baseData, selector: ':contains("test")' };
      await cssSelector.find(data, mockDocument);

      const button = mockDocument.querySelector('.btn');
      const span = mockDocument.querySelector('.text');
      const link = mockDocument.querySelector('.link');

      expect(button?.getAttribute('data-contains')).toBe('Click me');
      expect(span?.getAttribute('data-contains')).toBe('Hello World');
      expect(link?.getAttribute('data-contains')).toBe('Link text');
    });

    it('textContent와 innerText 같을 때 data-equal 속성 설정', async () => {
      const data = { ...baseData, selector: ':contains("test")' };
      await cssSelector.find(data, mockDocument);

      const span = mockDocument.querySelector('.text');
      expect(span?.getAttribute('data-equal')).toBe('Hello World');
    });

    it('텍스트 없는 요소는 마킹 안함', async () => {
      document.body.innerHTML += '<div class="empty"></div>';

      const data = { ...baseData, selector: ':contains("test")' };
      await cssSelector.find(data, mockDocument);

      const emptyDiv = mockDocument.querySelector('.empty');
      expect(emptyDiv?.getAttribute('data-contains')).toBe(null);
      expect(emptyDiv?.getAttribute('data-equal')).toBe(null);
    });
  });
});
