import {
  DOMProvider,
  SelectorData,
  ScrollOptions,
  FetchOptions,
  NetworkInterceptOptions,
  SaveOptions,
  ExportOptions,
  KeyOptions,
  BorderOptions,
  AiParseOptions
} from '@8g/workflow-engine';
import {
  findElement,
  pasteText,
  dispatchClickEvents,
  scrollIntoViewAndFocus,
  getElementCenter,
  scrollToElement,
  scrollToBottom,
  scrollByDistance,
  scrollUntilLoaded,
  convertToCSV,
} from '@/content/elements';

/**
 * Message types for Chrome extension internal communication
 * Used by ChromeDOMProvider, BackgroundManager, and MessageKernel
 */
export const MESSAGE_TYPES = {
  // Content Script -> Background (CDP operations)
  CDP_CLICK: 'CDP_CLICK',
  CDP_KEYPRESS: 'CDP_KEYPRESS',
  CDP_EXECUTE_JAVASCRIPT: 'CDP_EXECUTE_JAVASCRIPT',

  // Content Script -> Background (API operations)
  FETCH_API: 'FETCH_API',
  AI_PARSE_DATA: 'AI_PARSE_DATA',
  NETWORK_CATCH: 'NETWORK_CATCH',

  // Content Script -> Background (Data operations)
  EXPORT_DATA: 'EXPORT_DATA',
  SAVE_ASSET: 'SAVE_ASSET',

  // Content Script -> Background (Input operations)
  KEYPRESS: 'KEYPRESS',

  // Content Script -> Background (Tab operations)
  COLLECT_WORKFLOW_NEW_TAB: 'COLLECT_WORKFLOW_NEW_TAB',
  CLOSE_TAB_AND_FOCUS_PARENT: 'CLOSE_TAB_AND_FOCUS_PARENT',

  // Background -> Content Script (Block execution)
  EXECUTE_BLOCK: 'EXECUTE_BLOCK',

  // UI Control Messages
  SHOW_EXECUTION_STATUS: 'SHOW_EXECUTION_STATUS',
  HIDE_EXECUTION_STATUS: 'HIDE_EXECUTION_STATUS',
  SHOW_CONFIRMATION: 'SHOW_CONFIRMATION',
  CLOSE_TAB: 'CLOSE_TAB',
  TRIGGER_CONFIRMATION: 'TRIGGER_CONFIRMATION',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

/**
 * Chrome Extension implementation of DOMProvider interface
 * Bridges workflow-engine abstract interface with Chrome extension capabilities
 */
export class ChromeDOMProvider implements DOMProvider {
  // Element finding
  async findElement(data: SelectorData, context?: Document): Promise<Element | Element[] | null> {
    try {
      return await findElement(data, context || document);
    } catch (error) {
      console.error('[ChromeDOMProvider] findElement error:', error);
      return null;
    }
  }

  async waitForElement(data: SelectorData, timeout: number): Promise<Element | null> {
    try {
      const selectorData = {
        ...data,
        option: {
          ...data.option,
          waitForSelector: true,
          waitSelectorTimeout: timeout
        }
      };
      
      const result = await findElement(selectorData, document);
      
      // Handle array results - return first element if array
      if (Array.isArray(result)) {
        return result.length > 0 ? result[0] : null;
      }
      
      return result;
    } catch (error) {
      console.error('[ChromeDOMProvider] waitForElement error:', error);
      return null;
    }
  }

  async click(element: Element): Promise<void> {
    try {
      const htmlElement = element as HTMLElement;
      scrollIntoViewAndFocus(htmlElement);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const { x, y } = getElementCenter(htmlElement);

      try {
        const response = await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.CDP_CLICK,
          data: { x, y },
        });

        if (response && !response.$isError) {
          return;
        }
      } catch {
        // CDP failed, use fallback
      }

      dispatchClickEvents(htmlElement);
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      throw new Error(`Failed to click element: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getText(element: Element): Promise<string> {
    try {
      const htmlElement = element as HTMLElement;
      
      // Priority order for text extraction
      if (htmlElement.innerText) {
        return htmlElement.innerText.trim();
      }
      
      if (htmlElement.textContent) {
        return htmlElement.textContent.trim();
      }
      
      // For input elements, get value
      if (htmlElement instanceof HTMLInputElement && htmlElement.value) {
        return htmlElement.value.trim();
      }
      
      // Try common attributes
      const attributes = ['placeholder', 'title', 'aria-label', 'alt'];
      for (const attr of attributes) {
        const value = htmlElement.getAttribute(attr);
        if (value) {
          return value.trim();
        }
      }
      
      return '';
    } catch (error) {
      throw new Error(`Failed to get text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getValue(element: Element): Promise<string> {
    try {
      const htmlElement = element as HTMLElement;
      
      if (htmlElement instanceof HTMLInputElement) {
        return htmlElement.value || '';
      }
      
      if (htmlElement instanceof HTMLTextAreaElement) {
        return htmlElement.value || '';
      }
      
      if (htmlElement instanceof HTMLSelectElement) {
        return htmlElement.value || '';
      }
      
      // For non-form elements, fall back to text content
      return await this.getText(element);
    } catch (error) {
      throw new Error(`Failed to get value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setValue(element: Element, value: string): Promise<void> {
    try {
      const htmlElement = element as HTMLElement;
      
      if (htmlElement instanceof HTMLInputElement) {
        htmlElement.value = value;
        htmlElement.dispatchEvent(new Event('input', { bubbles: true }));
        htmlElement.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (htmlElement instanceof HTMLTextAreaElement) {
        htmlElement.value = value;
        htmlElement.dispatchEvent(new Event('input', { bubbles: true }));
        htmlElement.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (htmlElement instanceof HTMLSelectElement) {
        htmlElement.value = value;
        htmlElement.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (htmlElement.isContentEditable) {
        htmlElement.textContent = value;
        htmlElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        throw new Error('Element is not a form input or editable element');
      }
    } catch (error) {
      throw new Error(`Failed to set value: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAttribute(element: Element, attr: string): Promise<string> {
    try {
      const value = element.getAttribute(attr);
      return value || '';
    } catch (error) {
      throw new Error(`Failed to get attribute '${attr}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Page operations
  async navigate(url: string): Promise<void> {
    try {
      // Validate URL
      new URL(url);
      
      // Navigate in current window
      window.location.href = url;
      
      // Wait for navigation to start
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      throw new Error(`Failed to navigate to '${url}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scroll(options: ScrollOptions): Promise<void> {
    try {
      if (options.toElement) {
        const element = await this.findElement(options.toElement);
        if (element) {
          const target = Array.isArray(element) ? element[0] : element;
          scrollToElement(target as HTMLElement);
        }
      } else if (options.toBottom) {
        scrollToBottom();
      } else if (options.byDistance) {
        scrollByDistance({ x: options.byDistance.x, y: options.byDistance.y });
      } else if (options.untilLoaded) {
        await scrollUntilLoaded(options.untilLoaded);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      throw new Error(`Failed to scroll: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Networking & API (Chrome extension specific)
  async fetch(options: FetchOptions): Promise<Response> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.FETCH_API,
        data: {
          url: options.url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body,
          timeout: options.timeout || 30000
        },
      });

      if (response.$isError) {
        throw new Error(response.message || 'API request failed');
      }

      const fetchResponse = {
        status: response.data.status,
        statusText: response.data.statusText,
        ok: response.data.status >= 200 && response.data.status < 300,
        headers: new Headers(response.data.headers || {}),
        json: async () => response.data.data,
        text: async () => typeof response.data.data === 'string' ? response.data.data : JSON.stringify(response.data.data),
        blob: async () => new Blob([JSON.stringify(response.data.data)]),
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(response.data.data)).buffer
      } as Response;

      return fetchResponse;
    } catch (error) {
      throw new Error(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async interceptNetwork(options: NetworkInterceptOptions): Promise<any> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.NETWORK_CATCH,
        data: options
      });

      if (response.$isError) {
        throw new Error(response.message || 'Network interception failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Network interception failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // AI & Data processing (requires backend API)
  async parseWithAI(options: AiParseOptions): Promise<any> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.AI_PARSE_DATA,
        data: options
      });

      if (response.$isError) {
        throw new Error(response.message || 'AI parsing failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // File & Storage (Chrome extension specific)
  async saveAsset(data: any, options: SaveOptions): Promise<void> {
    try {
      let content: string;
      let mimeType: string;

      // Convert data based on type
      switch (options.dataType) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          break;
        case 'csv':
          content = convertToCSV(data);
          mimeType = 'text/csv';
          break;
        case 'text':
          content = typeof data === 'string' ? data : JSON.stringify(data);
          mimeType = 'text/plain';
          break;
        case 'binary':
          // Handle binary data (base64 encoded)
          content = data;
          mimeType = 'application/octet-stream';
          break;
        default:
          content = JSON.stringify(data);
          mimeType = 'application/json';
      }

      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SAVE_ASSET,
        data: {
          content,
          filename: options.filename || 'data.txt',
          mimeType,
          overwrite: options.overwrite || false
        }
      });
    } catch (error) {
      throw new Error(`Failed to save asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportData(data: any, options: ExportOptions): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.EXPORT_DATA,
        data: {
          data,
          filename: options.filename,
          format: options.format || 'json',
          includeHeaders: options.includeHeaders || false,
          compression: options.compression || false
        }
      });

      if (response.$isError) {
        throw new Error(response.message || 'Data export failed');
      }
    } catch (error) {
      throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Keyboard & Input (Chrome extension specific)
  async keypress(key: string, options: KeyOptions = {}): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CDP_KEYPRESS,
        data: {
          key,
          modifiers: options.modifiers || [],
          delay: options.delay || 0,
          repeat: options.repeat || 1
        }
      });

      if (response.$isError) {
        throw new Error(response.message || 'Keypress failed');
      }
    } catch (error) {
      throw new Error(`Failed to send keypress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async paste(text: string): Promise<void> {
    try {
      await pasteText(text);
    } catch (error) {
      throw new Error(`Failed to paste text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markBorder(element: Element, options: BorderOptions = {}): Promise<void> {
    try {
      const htmlElement = element as HTMLElement;
      const color = options.color || '#3b82f6';
      const width = options.width || 3;
      const style = options.style || 'solid';
      const temporary = options.temporary !== false;
      const duration = options.duration || 3000;

      scrollToElement(htmlElement);

      const originalBorder = htmlElement.style.border;
      const originalOutline = htmlElement.style.outline;

      htmlElement.style.border = `${width}px ${style} ${color}`;
      htmlElement.style.outline = 'none';

      if (temporary) {
        setTimeout(() => {
          htmlElement.style.border = originalBorder;
          htmlElement.style.outline = originalOutline;
        }, duration);
      }
    } catch (error) {
      throw new Error(`Failed to mark border: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setContentEditable(element: Element, editable: boolean): Promise<void> {
    try {
      const htmlElement = element as HTMLElement;
      htmlElement.contentEditable = editable ? 'true' : 'false';
      
      if (editable) {
        // Focus the element when making it editable
        htmlElement.focus();
      }
    } catch (error) {
      throw new Error(`Failed to set contentEditable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Internationalization (Chrome extension specific)
  // Note: This is a no-op in Chrome extension context as locale handling
  // is done by the ApplyLocaleBlock's translateObjectFallback function.
  // The DOMProvider interface requires this method but actual translation
  // logic doesn't need background communication.
  async applyLocale(_locale: string): Promise<void> {
    // No-op: Locale application is handled by the block's fallback translation
    // Chrome extension locale is managed via chrome.i18n API and browser settings
    console.log('[ChromeDOMProvider] applyLocale called, using fallback translation');
  }

  // Script execution (Chrome extension specific)
  async executeScript(script: string, context?: any): Promise<any> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.CDP_EXECUTE_JAVASCRIPT,
        data: {
          code: script,
          returnResult: true,
          timeout: context?.timeout || 30000
        }
      });

      if (response.$isError) {
        throw new Error(response.message || 'Script execution failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const chromeDOMProvider = new ChromeDOMProvider();