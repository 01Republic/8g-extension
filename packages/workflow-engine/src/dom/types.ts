export interface SelectorData {
  selector: string;
  findBy?: 'cssSelector' | 'xpath';
  option?: {
    waitForSelector?: boolean;
    waitSelectorTimeout?: number;
    multiple?: boolean;
    markEl?: boolean;
  };
}

export interface ScrollOptions {
  toElement?: SelectorData;
  toBottom?: boolean;
  byDistance?: { x: number; y: number };
  untilLoaded?: { maxWaitTime: number; scrollDelay: number };
}

export interface FetchOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface NetworkInterceptOptions {
  urlPattern?: string;
  method?: string;
  resourceType?: string;
  waitForResponse?: boolean;
  timeout?: number;
}

export interface SaveOptions {
  filename?: string;
  dataType?: 'json' | 'csv' | 'text' | 'binary';
  overwrite?: boolean;
}

export interface ExportOptions {
  filename: string;
  format?: 'json' | 'csv' | 'xlsx' | 'txt';
  includeHeaders?: boolean;
  compression?: boolean;
}

export interface KeyOptions {
  modifiers?: ('Alt' | 'Control' | 'Shift' | 'Meta')[];
  delay?: number;
  repeat?: number;
}

export interface BorderOptions {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted' | 'double';
  temporary?: boolean;
  duration?: number;
}

export interface AiParseOptions {
  sourceData: any;
  schemaDefinition: any;
  prompt?: string;
  model?: string;
  apiKey: string;
  provider: 'openai' | 'anthropic';
}