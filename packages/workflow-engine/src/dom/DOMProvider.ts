import {
  SelectorData,
  ScrollOptions,
  FetchOptions,
  NetworkInterceptOptions,
  SaveOptions,
  ExportOptions,
  KeyOptions,
  BorderOptions,
  AiParseOptions
} from './types';

/**
 * DOMProvider abstracts platform-specific DOM operations for workflow engine
 * Implementations: ChromeDOMProvider (extension), BrowserDOMProvider/MockDOMProvider (webapp)
 */
export interface DOMProvider {
  // Element finding
  findElement(data: SelectorData, context?: any): Promise<Element | Element[] | null>;
  waitForElement(data: SelectorData, timeout: number): Promise<Element | null>;
  
  // DOM manipulation
  click(element: Element): Promise<void>;
  getText(element: Element): Promise<string>;
  getValue(element: Element): Promise<string>;
  setValue(element: Element, value: string): Promise<void>;
  getAttribute(element: Element, attr: string): Promise<string>;
  
  // Page operations
  navigate(url: string): Promise<void>;
  scroll(options: ScrollOptions): Promise<void>;
  
  // Networking & API (optional - Chrome extension specific)
  fetch?(options: FetchOptions): Promise<Response>;
  interceptNetwork?(options: NetworkInterceptOptions): Promise<any>;
  
  // AI & Data processing (optional - requires backend API)
  parseWithAI?(options: AiParseOptions): Promise<any>;
  
  // File & Storage (optional - Chrome extension specific)
  saveAsset?(data: any, options: SaveOptions): Promise<void>;
  exportData?(data: any, options: ExportOptions): Promise<void>;
  
  // Keyboard & Input (optional - Chrome extension specific)
  keypress?(key: string, options?: KeyOptions): Promise<void>;
  paste?(text: string): Promise<void>;
  
  // UI manipulation (optional - Chrome extension specific)
  markBorder?(element: Element, options?: BorderOptions): Promise<void>;
  setContentEditable?(element: Element, editable: boolean): Promise<void>;
  
  // Internationalization (optional - Chrome extension specific)
  applyLocale?(locale: string): Promise<void>;
  
  // Script execution (optional - Chrome extension specific)
  executeScript?(script: string, context?: any): Promise<any>;
}