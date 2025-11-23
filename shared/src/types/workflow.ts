import { z } from 'zod';

// =========================
// Expression and Condition Types
// =========================

export type ExpressionString = string;

export type JsonCondition =
  | { exists: string }
  | { equals: { left: string; right: any } }
  | { notEquals: { left: string; right: any } }
  | { contains: { value: string; search: any } }
  | { regex: { value: string; pattern: string; flags?: string } }
  | { and: JsonCondition[] }
  | { or: JsonCondition[] }
  | { not: JsonCondition };

export interface Condition {
  expr?: ExpressionString;
  json?: JsonCondition;
}

// =========================
// Binding Types
// =========================

export type BindingValue = string | number | boolean | null | Record<string, any> | any[];

export interface Binding {
  template?: string;
  valueFrom?: string;
  default?: BindingValue;
}

// =========================
// Repeat Configuration Types
// =========================

export type RepeatScope = 'block' | 'subtree';

type RepeatBase = {
  continueOnError?: boolean;
  delayBetween?: number;
  scope?: RepeatScope;
  subtreeEnd?: string;
};

export type ForEachConfig = RepeatBase & {
  forEach: string;
  count?: never;
};

export type LoopConfig = RepeatBase & {
  count: number | string;
  forEach?: never;
};

export type RepeatConfig = ForEachConfig | LoopConfig;

// =========================
// Workflow Step Types
// =========================

export interface WorkflowStep {
  id: string;
  title?: string;
  when?: Condition;
  block?: any; // Will be defined by blocks package
  repeat?: RepeatConfig;
  next?: string;
  onSuccess?: string;
  onFailure?: string;
  switch?: Array<{ when: Condition; next: string }>;
  timeoutMs?: number;
  retry?: { attempts: number; delayMs?: number; backoffFactor?: number };
  delayAfterMs?: number;
  setVars?: Record<string, any>;
}

export interface Workflow {
  version: string;
  id?: string;
  title?: string;
  description?: string;
  start: string;
  steps: WorkflowStep[];
  vars?: Record<string, any>;
  defaultDelayMs?: number;
}

// =========================
// Currency Types
// =========================

export enum CurrencyCode {
  USD = 'USD', // 미국 달러
  KRW = 'KRW', // 한국 원
  EUR = 'EUR', // 유럽 유로
  GBP = 'GBP', // 영국 파운드 스털링
  CAD = 'CAD', // 캐나다 달러
  CNY = 'CNY', // 중국 위안
  JPY = 'JPY', // 일본 엔
  VND = 'VND', // 베트남 동
  ARS = 'ARS', // 아르헨티나 페소
  INR = 'INR', // 인도 루피
  TWD = 'TWD', // 대만 달러
  AUD = 'AUD', // 호주 달러
  HKD = 'HKD', // 홍콩 달러
  IDR = 'IDR', // 인도네시아 루피아
  MXN = 'MXN', // 멕시코 페소
  NZD = 'NZD', // 뉴질랜드 달러
  SGD = 'SGD', // 싱가포르 달러
  CHF = 'CHF', // 스위스 프랑
  THB = 'THB', // 태국 바트
  BRL = 'BRL', // 브라질 레알
  TRY = 'TRY', // 터키 리라
  RUB = 'RUB', // 러시아 루블
  NOK = 'NOK', // 노르웨이 크로네
  DKK = 'DKK', // 덴마크 크로네
  SEK = 'SEK', // 스웨덴 크로나
  ILS = 'ILS', // 이스라엘 세켈
  ZAR = 'ZAR', // 남아프리카 공화국 랜드
  PLN = 'PLN', // 폴란드 즐로티
  PHP = 'PHP', // 필리핀 페소
  CZK = 'CZK', // 체코 코루나
  CLP = 'CLP', // 칠레 페소
  COP = 'COP', // 콜롬비아 페소
  EGP = 'EGP', // 이집트 파운드
  MYR = 'MYR', // 말레이시아 링깃
  HUF = 'HUF', // 헝가리 포린트
  AED = 'AED', // 아랍에미리트 디르함
  SAR = 'SAR', // 사우디아라비아 리얄
  RON = 'RON', // 루마니아 레우
  BGN = 'BGN', // 불가리아 레프
}

export type CurrencyInfo = {
  code: string;
  symbol: string;
  format: string;
  amount: number;
  text?: string;
};

export const CurrencyInfoSchema = {
  code: {
    type: 'string' as const,
    enum: Object.values(CurrencyCode),
    description: 'Currency code',
  },
  symbol: {
    type: 'string' as const,
    enum: [
      '$', '₩', '€', '£', '¥', '₫', '₹', 'NT$', 'Rp', '₣', '฿', 'R$', '₺', '₽',
      'kr', '₪', 'R', 'zł', '₱', 'Kč', 'E£', 'RM', 'Ft', 'د.إ', '﷼', 'L', 'лв',
    ] as const,
    description: 'Currency symbol',
  },
  format: {
    type: 'string' as const,
    enum: ['%s%u', '%s%n', '%u%s', '%n%s', '%s %u', '%s %n', '%u %s', '%n %s'] as const,
    description: 'Display format (%s: symbol, %u/%n: amount)',
  },
  amount: {
    type: 'number' as const,
    description: 'Actual amount value',
  },
  text: {
    type: 'string' as const,
    description: 'Formatted display text (e.g., US$57.75)',
  },
};

// =========================
// Result Types
// =========================

export interface MemberOperationResult {
  email: string;
  operation: 'add' | 'delete';
  completed: boolean;
  reason?: string;
}

export interface ResDataContainer<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}