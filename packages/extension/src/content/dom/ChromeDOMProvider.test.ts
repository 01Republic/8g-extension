import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeDOMProvider } from './ChromeDOMProvider';
import type { SelectorData } from '@8g/workflow-engine';

// Mock chrome runtime for testing
const mockChrome = {
  runtime: {
    sendMessage: vi.fn()
  }
};

// Mock findElement function
vi.mock('@/content/elements', () => ({
  findElement: vi.fn()
}));

// Setup global mocks
beforeEach(() => {
  (global as any).chrome = mockChrome;
  (global as any).window = {
    scrollTo: vi.fn(),
    scrollX: 0,
    scrollY: 0,
    location: { href: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  (global as any).document = {
    body: { scrollHeight: 1000 },
    querySelector: vi.fn(),
    querySelectorAll: vi.fn()
  };
  (global as any).navigator = {
    clipboard: {
      writeText: vi.fn()
    }
  };
  vi.clearAllMocks();
});

describe('ChromeDOMProvider', () => {
  let provider: ChromeDOMProvider;

  beforeEach(() => {
    provider = new ChromeDOMProvider();
  });

  describe('findElement', () => {
    it('should call findElement utility with correct parameters', async () => {
      const { findElement } = await import('@/content/elements');
      const mockElement = document.createElement('div');
      (findElement as any).mockResolvedValue(mockElement);

      const selectorData: SelectorData = {
        selector: '.test-selector',
        findBy: 'cssSelector'
      };

      const result = await provider.findElement(selectorData);

      expect(findElement).toHaveBeenCalledWith(selectorData, document);
      expect(result).toBe(mockElement);
    });

    it('should handle errors gracefully', async () => {
      const { findElement } = await import('@/content/elements');
      (findElement as any).mockRejectedValue(new Error('Element not found'));

      const result = await provider.findElement({ selector: '.nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('waitForElement', () => {
    it('should set wait options and return single element from array', async () => {
      const { findElement } = await import('@/content/elements');
      const mockElement1 = document.createElement('div');
      const mockElement2 = document.createElement('span');
      (findElement as any).mockResolvedValue([mockElement1, mockElement2]);

      const selectorData: SelectorData = {
        selector: '.test-selector'
      };

      const result = await provider.waitForElement(selectorData, 5000);

      expect(findElement).toHaveBeenCalledWith({
        selector: '.test-selector',
        option: {
          waitForSelector: true,
          waitSelectorTimeout: 5000
        }
      }, document);
      expect(result).toBe(mockElement1);
    });
  });

  describe('getText', () => {
    it('should return innerText when available', async () => {
      const mockElement = {
        innerText: '  Test Text  ',
        textContent: 'fallback'
      } as HTMLElement;

      const result = await provider.getText(mockElement);

      expect(result).toBe('Test Text');
    });

    it('should fallback to textContent when innerText is not available', async () => {
      const mockElement = {
        innerText: '',
        textContent: '  Fallback Text  '
      } as HTMLElement;

      const result = await provider.getText(mockElement);

      expect(result).toBe('Fallback Text');
    });

    it('should get value from input elements', async () => {
      const mockInput = {
        innerText: '',
        textContent: '',
        value: '  Input Value  '
      } as HTMLInputElement;

      // Mock instanceof check
      Object.setPrototypeOf(mockInput, HTMLInputElement.prototype);

      const result = await provider.getText(mockInput);

      expect(result).toBe('Input Value');
    });
  });

  describe('click', () => {
    it('should attempt CDP click first, then fallback to events', async () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        focus: vi.fn(),
        getBoundingClientRect: () => ({
          left: 100,
          top: 200,
          width: 50,
          height: 30
        }),
        dispatchEvent: vi.fn()
      } as any;

      // Mock CDP failure
      mockChrome.runtime.sendMessage.mockResolvedValue({ $isError: true });

      await provider.click(mockElement);

      expect(mockElement.scrollIntoView).toHaveBeenCalled();
      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CDP_CLICK',
        data: { x: 125, y: 215 }
      });
      expect(mockElement.dispatchEvent).toHaveBeenCalledTimes(3); // mousedown, mouseup, click
    });
  });

  describe('setValue', () => {
    it('should set value on input elements and dispatch events', async () => {
      const mockInput = {
        value: '',
        dispatchEvent: vi.fn()
      } as any;

      Object.setPrototypeOf(mockInput, HTMLInputElement.prototype);

      await provider.setValue(mockInput, 'test value');

      expect(mockInput.value).toBe('test value');
      expect(mockInput.dispatchEvent).toHaveBeenCalledTimes(2); // input and change events
    });

    it('should handle contentEditable elements', async () => {
      const mockElement = {
        isContentEditable: true,
        textContent: '',
        dispatchEvent: vi.fn()
      } as any;

      await provider.setValue(mockElement, 'editable content');

      expect(mockElement.textContent).toBe('editable content');
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'input' })
      );
    });
  });

  describe('navigate', () => {
    it('should set window.location.href for navigation', async () => {
      const testUrl = 'https://example.com';

      await provider.navigate(testUrl);

      expect((global as any).window.location.href).toBe(testUrl);
    });

    it('should throw error for invalid URLs', async () => {
      await expect(provider.navigate('invalid-url')).rejects.toThrow();
    });
  });

  describe('fetch', () => {
    it('should use chrome runtime to send fetch requests', async () => {
      const mockResponse = {
        data: {
          status: 200,
          statusText: 'OK',
          data: { result: 'success' },
          headers: { 'content-type': 'application/json' }
        }
      };

      mockChrome.runtime.sendMessage.mockResolvedValue(mockResponse);

      const result = await provider.fetch({
        url: 'https://api.example.com/data',
        method: 'GET'
      });

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'FETCH_API',
        data: {
          url: 'https://api.example.com/data',
          method: 'GET',
          headers: {},
          body: undefined,
          timeout: 30000
        }
      });

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(await result.json()).toEqual({ result: 'success' });
    });
  });

  describe('markBorder', () => {
    it('should apply border styling to elements', async () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
        style: {}
      } as any;

      await provider.markBorder(mockElement, {
        color: '#ff0000',
        width: 2,
        style: 'dashed',
        temporary: true,
        duration: 1000
      });

      expect(mockElement.scrollIntoView).toHaveBeenCalled();
      expect(mockElement.style.border).toBe('2px dashed #ff0000');
      expect(mockElement.style.outline).toBe('none');
    });
  });
});