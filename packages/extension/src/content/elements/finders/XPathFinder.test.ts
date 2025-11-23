import { describe, it, expect, beforeEach } from 'vitest';
import { XPathSelector } from './XPathFinder';
import { SelectorData } from '..';

describe('XPathSelector 테스트', () => {
  let xpathSelector: XPathSelector;
  let mockDocument: Document;

  beforeEach(() => {
    xpathSelector = new XPathSelector();

    // Create a mock document with JSDOM
    document.body.innerHTML = `
      <div id="test-container">
        <button class="btn primary" data-id="123">Click me</button>
        <span class="text">Hello World</span>
        <a href="/link" class="link">Link text</a>
        <div class="nested">
          <p>Nested content</p>
          <p>Another paragraph</p>
        </div>
        <ul class="list">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    `;
    mockDocument = document;
  });

  const baseData: SelectorData = {
    selector: '',
    findBy: 'xpath',
  };

  describe('find 메서드', () => {
    it('XPath로 단일 요소 찾기', async () => {
      const data = { ...baseData, selector: '//button[@class="btn primary"]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).tagName).toBe('BUTTON');
      expect((result as Element).textContent?.trim()).toBe('Click me');
    });

    it('ID로 요소 찾기', async () => {
      const data = { ...baseData, selector: '//*[@id="test-container"]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).id).toBe('test-container');
    });

    it('텍스트 내용으로 요소 찾기', async () => {
      const data = { ...baseData, selector: '//span[text()="Hello World"]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Hello World');
    });

    it('contains 함수로 텍스트 포함하는 요소 찾기', async () => {
      const data = { ...baseData, selector: '//span[contains(text(),"Hello")]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Hello World');
    });

    it('속성값으로 요소 찾기', async () => {
      const data = { ...baseData, selector: '//button[@data-id="123"]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).getAttribute('data-id')).toBe('123');
    });

    it('중첩된 요소 찾기', async () => {
      const data = { ...baseData, selector: '//div[@class="nested"]/p[1]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Nested content');
    });

    it('존재하지 않는 요소는 null 반환', async () => {
      const data = { ...baseData, selector: '//div[@class="non-existent"]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('잘못된 XPath는 에러 안내고 null 반환', async () => {
      const data = { ...baseData, selector: '//[invalid xpath syntax' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('multiple 옵션 테스트', () => {
    it('multiple true일 때 여러 요소들 배열로 반환', async () => {
      const data = { ...baseData, selector: '//li', option: { multiple: true } };
      const result = await xpathSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(true);
      expect((result as Element[]).length).toBe(3);
      expect((result as Element[])[0].textContent?.trim()).toBe('Item 1');
      expect((result as Element[])[1].textContent?.trim()).toBe('Item 2');
      expect((result as Element[])[2].textContent?.trim()).toBe('Item 3');
    });

    it('multiple true인데 요소 없으면 null 반환', async () => {
      const data = { ...baseData, selector: '//nonexistent', option: { multiple: true } };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('multiple false면 첫 번째 요소만 반환', async () => {
      const data = { ...baseData, selector: '//li', option: { multiple: false } };
      const result = await xpathSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(false);
      expect((result as Element).textContent?.trim()).toBe('Item 1');
    });

    it('multiple 옵션 안주면 기본값 false로 단일 요소 반환', async () => {
      const data = { ...baseData, selector: '//li' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(false);
      expect((result as Element).textContent?.trim()).toBe('Item 1');
    });
  });

  describe('waitForElement 메서드', () => {
    it('요소 나타날 때까지 기다리기', async () => {
      const data = { ...baseData, selector: '//div[@class="delayed-element"]' };

      setTimeout(() => {
        document.body.innerHTML += '<div class="delayed-element">Delayed content</div>';
      }, 200);

      const result = await xpathSelector.waitForElement(data, mockDocument, 1000);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Delayed content');
    });

    it('요소 안 나타나면 타임아웃으로 null 반환', async () => {
      const data = { ...baseData, selector: '//div[@class="never-appears"]' };

      const result = await xpathSelector.waitForElement(data, mockDocument, 100);

      expect(result).toBe(null);
    });

    it('요소 이미 있으면 바로 반환', async () => {
      const data = { ...baseData, selector: '//button' };

      const startTime = Date.now();
      const result = await xpathSelector.waitForElement(data, mockDocument, 1000);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should return almost immediately
    });
  });

  describe('복잡한 XPath 표현식들', () => {
    it('ancestor 축 사용해서 상위 요소 찾기', async () => {
      const data = {
        ...baseData,
        selector: '//p[text()="Nested content"]/ancestor::div[@class="nested"]',
      };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).className).toBe('nested');
    });

    it('following-sibling 축으로 형제 요소 찾기', async () => {
      const data = { ...baseData, selector: '//p[text()="Nested content"]/following-sibling::p' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Another paragraph');
    });

    it('position() 함수로 특정 위치 요소 찾기', async () => {
      const data = { ...baseData, selector: '//li[position()=2]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Item 2');
    });

    it('last() 함수로 마지막 요소 찾기', async () => {
      const data = { ...baseData, selector: '//li[last()]' };
      const result = await xpathSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Item 3');
    });
  });
});
