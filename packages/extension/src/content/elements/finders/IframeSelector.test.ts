import { describe, it, expect, beforeEach } from 'vitest';
import { IframSelector } from './IframeSelector';
import { SelectorData } from '..';

describe('IframSelector 테스트', () => {
  let iframeSelector: IframSelector;
  let mockDocument: Document;

  beforeEach(() => {
    iframeSelector = new IframSelector();

    // Create a mock document with iframes
    document.body.innerHTML = `
      <div id="test-container">
        <iframe id="main-frame" src="about:blank"></iframe>
        <iframe class="secondary-frame" src="about:blank"></iframe>
        <iframe id="empty-frame"></iframe>
        <div class="not-iframe">Not an iframe</div>
      </div>
    `;

    // Setup iframe content for main-frame
    const mainFrame = document.querySelector('#main-frame') as HTMLIFrameElement;
    if (mainFrame) {
      // Create a mock contentDocument
      const iframeDoc = document.implementation.createHTMLDocument('Iframe Content');
      iframeDoc.body.innerHTML = `
        <div class="iframe-content">
          <button class="iframe-button">Iframe Button</button>
          <span class="iframe-text">Iframe Text</span>
          <ul class="iframe-list">
            <li>Iframe Item 1</li>
            <li>Iframe Item 2</li>
            <li>Iframe Item 3</li>
          </ul>
          <form class="iframe-form">
            <input type="text" class="iframe-input" value="iframe input">
            <select class="iframe-select">
              <option value="1">Option 1</option>
              <option value="2">Option 2</option>
            </select>
          </form>
        </div>
      `;
      // Mock contentDocument property
      Object.defineProperty(mainFrame, 'contentDocument', {
        value: iframeDoc,
        writable: false,
      });
    }

    // Setup iframe content for secondary-frame
    const secondaryFrame = document.querySelector('.secondary-frame') as HTMLIFrameElement;
    if (secondaryFrame) {
      const iframeDoc = document.implementation.createHTMLDocument('Secondary Content');
      iframeDoc.body.innerHTML = `
        <div class="secondary-content">
          <p class="secondary-text">Secondary Text</p>
          <a href="#" class="secondary-link">Secondary Link</a>
        </div>
      `;
      Object.defineProperty(secondaryFrame, 'contentDocument', {
        value: iframeDoc,
        writable: false,
      });
    }

    // Setup empty iframe (no contentDocument)
    const emptyFrame = document.querySelector('#empty-frame') as HTMLIFrameElement;
    if (emptyFrame) {
      Object.defineProperty(emptyFrame, 'contentDocument', {
        value: null,
        writable: false,
      });
    }

    mockDocument = document;
  });

  const baseData: SelectorData = {
    selector: '',
    findBy: 'cssSelector',
  };

  describe('기본 Iframe 탐색', () => {
    it('iframe 내부 버튼 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> .iframe-button' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).className).toBe('iframe-button');
      expect((result as Element).textContent?.trim()).toBe('Iframe Button');
    });

    it('iframe 내부 텍스트 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> .iframe-text' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Iframe Text');
    });

    it('클래스명으로 iframe 선택하고 내부 요소 찾기', async () => {
      const data = { ...baseData, selector: '.secondary-frame |> .secondary-text' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Secondary Text');
    });

    it('iframe 내부 폼 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> .iframe-input' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as HTMLInputElement).value).toBe('iframe input');
    });
  });

  describe('multiple 옵션 테스트', () => {
    it('iframe 내부 여러 요소들 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> li', option: { multiple: true } };
      const result = await iframeSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(true);
      expect((result as Element[]).length).toBe(3);
      expect((result as Element[])[0].textContent?.trim()).toBe('Iframe Item 1');
      expect((result as Element[])[1].textContent?.trim()).toBe('Iframe Item 2');
      expect((result as Element[])[2].textContent?.trim()).toBe('Iframe Item 3');
    });

    it('multiple true인데 요소 없으면 빈 배열 반환', async () => {
      const data = {
        ...baseData,
        selector: '#main-frame |> .non-existent',
        option: { multiple: true },
      };
      const result = await iframeSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(true);
      expect((result as Element[]).length).toBe(0);
    });

    it('multiple false면 첫 번째 요소만 반환', async () => {
      const data = { ...baseData, selector: '#main-frame |> li', option: { multiple: false } };
      const result = await iframeSelector.find(data, mockDocument);

      expect(Array.isArray(result)).toBe(false);
      expect((result as Element).textContent?.trim()).toBe('Iframe Item 1');
    });
  });

  describe('에러 케이스들', () => {
    it('존재하지 않는 iframe 선택하면 null 반환', async () => {
      const data = { ...baseData, selector: '#non-existent-frame |> .some-element' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('iframe이 아닌 요소 선택하면 null 반환', async () => {
      const data = { ...baseData, selector: '.not-iframe |> .some-element' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('contentDocument 없는 iframe은 null 반환', async () => {
      const data = { ...baseData, selector: '#empty-frame |> .some-element' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('iframe 내부에 존재하지 않는 요소는 null 반환', async () => {
      const data = { ...baseData, selector: '#main-frame |> .non-existent-element' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('|> 구분자 없으면 에러', async () => {
      const data = { ...baseData, selector: '#main-frame .iframe-button' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('빈 선택자는 null 반환', async () => {
      const data = { ...baseData, selector: '' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('iframe 선택자 부분이 비어있으면 null 반환', async () => {
      const data = { ...baseData, selector: ' |> .iframe-button' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });

    it('내부 선택자 부분이 비어있으면 null 반환', async () => {
      const data = { ...baseData, selector: '#main-frame |> ' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBe(null);
    });
  });

  describe('waitForElement 메서드', () => {
    it('iframe 내부 요소 나타날 때까지 기다리기', async () => {
      const data = { ...baseData, selector: '#main-frame |> .delayed-iframe-element' };

      setTimeout(() => {
        const mainFrame = document.querySelector('#main-frame') as HTMLIFrameElement;
        if (mainFrame?.contentDocument) {
          const content = mainFrame.contentDocument.querySelector('.iframe-content');
          if (content) {
            content.innerHTML += '<div class="delayed-iframe-element">Delayed iframe content</div>';
          }
        }
      }, 200);

      const result = await iframeSelector.waitForElement(data, mockDocument, 1000);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Delayed iframe content');
    });

    it('iframe 내부 요소 안 나타나면 타임아웃으로 null 반환', async () => {
      const data = { ...baseData, selector: '#main-frame |> .never-appears' };

      const result = await iframeSelector.waitForElement(data, mockDocument, 100);

      expect(result).toBe(null);
    });

    it('iframe 내부 요소 이미 있으면 바로 반환', async () => {
      const data = { ...baseData, selector: '#main-frame |> .iframe-button' };

      const startTime = Date.now();
      const result = await iframeSelector.waitForElement(data, mockDocument, 1000);
      const endTime = Date.now();

      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(50); // Should return almost immediately
    });
  });

  describe('복잡한 선택자들', () => {
    it('iframe 내부 복합 선택자로 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> .iframe-content .iframe-button' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Iframe Button');
    });

    it('iframe 내부 속성 선택자로 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> input[type="text"]' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as HTMLInputElement).type).toBe('text');
    });

    it('iframe 내부 nth-child 선택자로 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> li:nth-child(2)' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).textContent?.trim()).toBe('Iframe Item 2');
    });

    it('iframe 내부 태그명으로 요소 찾기', async () => {
      const data = { ...baseData, selector: '#main-frame |> button' };
      const result = await iframeSelector.find(data, mockDocument);

      expect(result).toBeTruthy();
      expect((result as Element).tagName).toBe('BUTTON');
    });
  });
});
