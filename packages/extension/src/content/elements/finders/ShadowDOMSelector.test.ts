import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowDOMSelector } from './ShadowDOMSelector';
import { SelectorData } from '..';

describe('ShadowDOMSelector 테스트', () => {
  let shadowDOMSelector: ShadowDOMSelector;
  let mockDocument: Document;

  beforeEach(() => {
    shadowDOMSelector = new ShadowDOMSelector();

    // Create a mock document with Shadow DOM elements
    document.body.innerHTML = `
      <div id="test-container">
        <my-component class="outer-component">
          <span class="fallback">Fallback content</span>
        </my-component>
        <another-component class="second-component">
          <div class="backup">Backup content</div>
        </another-component>
      </div>
    `;

    // Create shadow DOM for my-component
    const myComponent = document.querySelector('my-component');
    if (myComponent) {
      const shadowRoot1 = myComponent.attachShadow({ mode: 'open' });
      shadowRoot1.innerHTML = `
        <style>
          .shadow-content { color: blue; }
        </style>
        <div class="shadow-wrapper">
          <button class="shadow-button">Shadow Button</button>
          <span class="shadow-text">Shadow Text</span>
          <nested-component class="nested">
            <div class="nested-fallback">Nested fallback</div>
          </nested-component>
        </div>
      `;

      // Create nested shadow DOM
      const nestedComponent = shadowRoot1.querySelector('nested-component');
      if (nestedComponent) {
        const shadowRoot2 = nestedComponent.attachShadow({ mode: 'open' });
        shadowRoot2.innerHTML = `
          <div class="deep-content">
            <p class="deep-text">Deep shadow text</p>
            <ul class="deep-list">
              <li>Deep item 1</li>
              <li>Deep item 2</li>
            </ul>
          </div>
        `;
      }
    }

    // Create shadow DOM for another-component
    const anotherComponent = document.querySelector('another-component');
    if (anotherComponent) {
      const shadowRoot3 = anotherComponent.attachShadow({ mode: 'open' });
      shadowRoot3.innerHTML = `
        <div class="another-wrapper">
          <input type="text" class="shadow-input" value="test input">
          <div class="shadow-box">Box content</div>
        </div>
      `;
    }

    mockDocument = document;
  });

  const baseData: SelectorData = {
    selector: '',
    findBy: 'cssSelector',
  };

  describe('기본 Shadow DOM 탐색', () => {
    it('Shadow DOM 내부 요소 찾기', async () => {
      const data = { ...baseData, selector: 'my-component >> .shadow-button' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).className).toBe('shadow-button');
      expect((result as Element).textContent?.trim()).toBe('Shadow Button');
    });

    it('Shadow DOM 내부 텍스트 요소 찾기', async () => {
      const data = { ...baseData, selector: 'my-component >> .shadow-text' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Shadow Text');
    });

    it('다른 컴포넌트의 Shadow DOM 요소 찾기', async () => {
      const data = { ...baseData, selector: 'another-component >> .shadow-input' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as HTMLInputElement).value).toBe('test input');
    });

    it('Shadow DOM 없는 요소에서는 null 반환', async () => {
      const data = { ...baseData, selector: 'div >> .non-existent' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('중첩된 Shadow DOM 탐색', () => {
    it('깊게 중첩된 Shadow DOM 요소 찾기', async () => {
      const data = { ...baseData, selector: 'my-component >> nested-component >> .deep-text' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Deep shadow text');
    });

    it('중첩된 Shadow DOM에서 리스트 요소 찾기', async () => {
      const data = { ...baseData, selector: 'my-component >> nested-component >> .deep-list' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).tagName).toBe('UL');
      expect((result as Element).children.length).toBe(2);
    });

    it('존재하지 않는 중첩 경로는 null 반환', async () => {
      const data = { ...baseData, selector: 'my-component >> non-existent >> .something' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('multiple 옵션 테스트', () => {
    it('Shadow DOM 내부 여러 요소들 찾기', async () => {
      const data = {
        ...baseData,
        selector: 'my-component >> nested-component >> li',
        option: { multiple: true },
      };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(true);
      expect((result as Element[]).length).toBe(2);
      expect((result as Element[])[0].textContent?.trim()).toBe('Deep item 1');
      expect((result as Element[])[1].textContent?.trim()).toBe('Deep item 2');
    });

    it('multiple true인데 요소 없으면 빈 배열 반환', async () => {
      const data = {
        ...baseData,
        selector: 'my-component >> .non-existent',
        option: { multiple: true },
      };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(true);
      expect((result as Element[]).length).toBe(0);
    });

    it('multiple false면 첫 번째 요소만 반환', async () => {
      const data = {
        ...baseData,
        selector: 'my-component >> nested-component >> li',
        option: { multiple: false },
      };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(false);
      expect((result as Element).textContent?.trim()).toBe('Deep item 1');
    });
  });

  describe('waitForElement 메서드', () => {
    it('Shadow DOM 요소 나타날 때까지 기다리기', async () => {
      const data = { ...baseData, selector: 'my-component >> .delayed-shadow-element' };

      setTimeout(() => {
        const myComponent = document.querySelector('my-component');
        if (myComponent?.shadowRoot) {
          const wrapper = myComponent.shadowRoot.querySelector('.shadow-wrapper');
          if (wrapper) {
            wrapper.innerHTML += '<div class="delayed-shadow-element">Delayed shadow content</div>';
          }
        }
      }, 200);

      const result = await shadowDOMSelector.waitForElement(data, mockDocument, 1000);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Delayed shadow content');
    });

    it('Shadow DOM 요소 안 나타나면 타임아웃으로 null 반환', async () => {
      const data = { ...baseData, selector: 'my-component >> .never-appears' };

      const result = await shadowDOMSelector.waitForElement(data, mockDocument, 100);

      expect(result).toBe(null);
    });

    it('Shadow DOM 요소 이미 있으면 바로 반환해야지', async () => {
      const data = { ...baseData, selector: 'my-component >> .shadow-button' };

      const startTime = Date.now();
      const result = await shadowDOMSelector.waitForElement(data, mockDocument, 1000);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should return almost immediately
    });
  });

  describe('복잡한 Shadow DOM 선택자들', () => {
    it('클래스 조합으로 Shadow DOM 요소 찾기', async () => {
      const data = { ...baseData, selector: '.outer-component >> .shadow-wrapper .shadow-button' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Shadow Button');
    });

    it('속성 선택자로 Shadow DOM 요소 찾기', async () => {
      const data = { ...baseData, selector: 'another-component >> input[type="text"]' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as HTMLInputElement).type).toBe('text');
    });

    it('태그명으로 Shadow DOM 요소 찾기', async () => {
      const data = { ...baseData, selector: 'my-component >> button' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).tagName).toBe('BUTTON');
    });

    it('잘못된 Shadow DOM 경로는 null 반환', async () => {
      const data = { ...baseData, selector: 'invalid-component >> .shadow-element' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('>> 구분자 없으면 일반 CSS selector처럼 작동', async () => {
      const data = { ...baseData, selector: 'my-component' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).tagName).toBe('MY-COMPONENT');
    });

    it('빈 선택자는 null 반환', async () => {
      const data = { ...baseData, selector: '' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('공백만 있는 선택자 부분 처리', async () => {
      const data = { ...baseData, selector: 'my-component >>   >> .shadow-button' };
      const result = await shadowDOMSelector.find(data, mockDocument);

      // 빈 부분이 있어서 null이 되어야 함
      expect(result).toBe(null);
    });
  });
});
