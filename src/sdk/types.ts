import { Block } from '../blocks';
export * from '../blocks';

// =========================
// Workflow Types
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

export class Condition {
  expr?: ExpressionString;
  json?: JsonCondition;
}

export type BindingValue = string | number | boolean | null | Record<string, any> | any[];

export class Binding {
  template?: string;
  valueFrom?: string;
  default?: BindingValue;
}

export type ForEachConfig = {
  forEach: string; // 배열 경로 (예: '$.steps.getIds.result.data')
  continueOnError?: boolean; // 에러 발생해도 계속 진행
  delayBetween?: number; // 반복 사이 대기 시간 (ms)
};

export type LoopConfig = {
  count: number | string; // 반복 횟수 (숫자 또는 바인딩 경로)
  continueOnError?: boolean; // 에러 발생해도 계속 진행
  delayBetween?: number; // 반복 사이 대기 시간 (ms)
};

export type RepeatConfig = ForEachConfig | LoopConfig;

export class WorkflowStep {
  id!: string;
  title?: string;
  when?: Condition;
  block?: Block; // BlockBase 호환. 바인딩은 런타임에서 해석
  repeat?: RepeatConfig; // 반복 설정 (forEach 또는 count)`
  next?: string;
  onSuccess?: string;
  onFailure?: string;
  switch?: Array<{ when: Condition; next: string }>;
  timeoutMs?: number;
  retry?: { attempts: number; delayMs?: number; backoffFactor?: number };
  delayAfterMs?: number;
}

export class Workflow {
  version!: '1.0';
  id?: string;
  title?: string;
  description?: string;
  start!: string;
  steps!: WorkflowStep[];
  vars?: Record<string, any>; // 워크플로우 초기 변수
  defaultDelayMs?: number;
}

export type CollectWorkflowRequest = {
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
  timeoutMs?: number; // SDK timeout (기본값: 600000ms = 10분)
};

export class WorkflowStepRunResult<T = any> {
  stepId!: string;
  skipped!: boolean;
  success!: boolean;
  message?: string;
  result?: T;
  startedAt!: string;
  finishedAt!: string;
  attempts!: number;
}

export class CollectWorkflowResult<T = any> {
  success!: boolean;
  steps!: WorkflowStepRunResult<T>[];
  targetUrl!: string;
  timestamp!: string;
  error?: string;
}

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
  code: CurrencyCode;
  symbol: string;
  local?: string;
  abbreviation?: string;
  format: string;
  desc: string;
};

/**
 * 금액 정보를 포함하는 통화 타입
 * CurrencyInfo를 확장하여 실제 금액(amount)과 표시 텍스트(text)를 포함
 */
export type CurrencyAmount = CurrencyInfo & {
  amount: number; // 실제 금액
  text?: string; // 표시용 텍스트 (예: "US$57.75")
};

/**
 * format
 * %s: symbol
 * %u: amount
 * %n: amount
 *
 * u, n이 섞여있는 휴먼에러 있음.
 */
export const CurrencyInfoUsd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['USD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., US$57.75)',
    },
  },
};

export const CurrencyInfoEur = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['EUR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['€'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., US$57.75)',
    },
  },
};

export const CurrencyInfoKrw = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['KRW'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₩'] as const,
      description: 'Currency symbol',
    },
    local: {
      type: 'string' as const,
      enum: ['원'] as const,
      description: 'Local currency name',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₩57,750원)',
    },
  },
};

export const CurrencyInfoGbp = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['GBP'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['£'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., £57.75)',
    },
  },
};

export const CurrencyInfoCad = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['CAD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., CA$57.75)',
    },
  },
};

export const CurrencyInfoCny = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['CNY'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['¥'] as const,
      description: 'Currency symbol',
    },
    local: {
      type: 'string' as const,
      enum: ['元'] as const,
      description: 'Local currency name',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ¥57.75)',
    },
  },
};

export const CurrencyInfoJpy = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['JPY'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['¥'] as const,
      description: 'Currency symbol',
    },
    local: {
      type: 'string' as const,
      enum: ['円'] as const,
      description: 'Local currency name',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ¥5775)',
    },
  },
};

export const CurrencyInfoVnd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['VND'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₫'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₫577,500)',
    },
  },
};

export const CurrencyInfoArs = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['ARS'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., $57.75)',
    },
  },
};

export const CurrencyInfoInr = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['INR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₹'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₹57.75)',
    },
  },
};

export const CurrencyInfoTwd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['TWD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['NT$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., NT$57.75)',
    },
  },
};

export const CurrencyInfoAud = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['AUD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., A$57.75)',
    },
  },
};

export const CurrencyInfoHkd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['HKD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., HK$57.75)',
    },
  },
};

export const CurrencyInfoIdr = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['IDR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['Rp'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., Rp57,750)',
    },
  },
};

export const CurrencyInfoMxn = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['MXN'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., MX$57.75)',
    },
  },
};

export const CurrencyInfoNzd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['NZD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., NZ$57.75)',
    },
  },
};

export const CurrencyInfoSgd = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['SGD'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., S$57.75)',
    },
  },
};

export const CurrencyInfoChf = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['CHF'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₣'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₣57.75)',
    },
  },
};

export const CurrencyInfoThb = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['THB'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['฿'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ฿57.75)',
    },
  },
};

export const CurrencyInfoBrl = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['BRL'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['R$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., R$57.75)',
    },
  },
};

export const CurrencyInfoTry = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['TRY'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₺'] as const,
      description: 'Currency symbol',
    },
    abbreviation: {
      type: 'string' as const,
      enum: ['TL'] as const,
      description: 'Currency abbreviation',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₺57.75)',
    },
  },
};

export const CurrencyInfoRub = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['RUB'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₽'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₽57.75)',
    },
  },
};

export const CurrencyInfoNok = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['NOK'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['kr'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., kr57.75)',
    },
  },
};

export const CurrencyInfoDkk = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['DKK'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['kr'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., kr57.75)',
    },
  },
};

export const CurrencyInfoSek = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['SEK'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['kr'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., kr57.75)',
    },
  },
};

export const CurrencyInfoIls = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['ILS'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₪'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₪57.75)',
    },
  },
};

export const CurrencyInfoZar = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['ZAR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['R'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., R57.75)',
    },
  },
};

export const CurrencyInfoPln = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['PLN'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['zł'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., zł57.75)',
    },
  },
};

export const CurrencyInfoPhp = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['PHP'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['₱'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ₱57.75)',
    },
  },
};

export const CurrencyInfoCzk = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['CZK'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['Kč'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., Kč57.75)',
    },
  },
};

export const CurrencyInfoClp = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['CLP'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., $57.75)',
    },
  },
};

export const CurrencyInfoCop = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['COP'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['$'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., $57.75)',
    },
  },
};

export const CurrencyInfoEgp = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['EGP'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['E£'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., E£57.75)',
    },
  },
};

export const CurrencyInfoMyr = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['MYR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['RM'] as const,
      description: 'Currency symbol',
    },
    local: {
      type: 'string' as const,
      enum: ['令吉'] as const,
      description: 'Local currency name',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., RM57.75)',
    },
  },
};

export const CurrencyInfoHuf = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['HUF'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['Ft'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., Ft57.75)',
    },
  },
};

export const CurrencyInfoAed = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['AED'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['د.إ'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., د.إ57.75)',
    },
  },
};

export const CurrencyInfoSar = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['SAR'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['﷼'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., ﷼57.75)',
    },
  },
};

export const CurrencyInfoRon = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['RON'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['L'] as const,
      description: 'Currency symbol',
    },
    local: {
      type: 'string' as const,
      enum: ['lei'] as const,
      description: 'Local currency name',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., L57.75)',
    },
  },
};

export const CurrencyInfoBgn = {
  type: 'object' as const,
  shape: {
    code: {
      type: 'string' as const,
      enum: ['BGN'] as const,
      description: 'Currency code',
    },
    symbol: {
      type: 'string' as const,
      enum: ['лв'] as const,
      description: 'Currency symbol',
    },
    format: {
      type: 'string' as const,
      enum: ['%s%u'] as const,
      description: 'Display format',
    },
    desc: {
      type: 'string' as const,
      description: 'Currency description',
    },
    amount: {
      type: 'number' as const,
      description: 'Actual amount value',
    },
    text: {
      type: 'string' as const,
      description: 'Formatted display text (e.g., лв57.75)',
    },
  },
};

/**
 * CurrencyCode를 key로, 해당 통화의 스키마를 value로 하는 매핑 객체
 * 
 * 사용 예시:
 * ```typescript
 * import { CurrencySchemaMap } from '8g-extension-sdk';
 * 
 * // 통화 코드로 스키마 선택
 * const selectedCurrency = 'USD';
 * const schema = CurrencySchemaMap[selectedCurrency];
 * 
 * // AI Parse 블록에서 사용
 * const billingSchema = createSchema({
 *   planName: Schema.string(),
 *   amount: CurrencySchemaMap['KRW'], // KRW 스키마 사용
 * });
 * ```
 */
export const CurrencySchemaMap = {
  [CurrencyCode.USD]: CurrencyInfoUsd,
  [CurrencyCode.EUR]: CurrencyInfoEur,
  [CurrencyCode.KRW]: CurrencyInfoKrw,
  [CurrencyCode.GBP]: CurrencyInfoGbp,
  [CurrencyCode.CAD]: CurrencyInfoCad,
  [CurrencyCode.CNY]: CurrencyInfoCny,
  [CurrencyCode.JPY]: CurrencyInfoJpy,
  [CurrencyCode.VND]: CurrencyInfoVnd,
  [CurrencyCode.ARS]: CurrencyInfoArs,
  [CurrencyCode.INR]: CurrencyInfoInr,
  [CurrencyCode.TWD]: CurrencyInfoTwd,
  [CurrencyCode.AUD]: CurrencyInfoAud,
  [CurrencyCode.HKD]: CurrencyInfoHkd,
  [CurrencyCode.IDR]: CurrencyInfoIdr,
  [CurrencyCode.MXN]: CurrencyInfoMxn,
  [CurrencyCode.NZD]: CurrencyInfoNzd,
  [CurrencyCode.SGD]: CurrencyInfoSgd,
  [CurrencyCode.CHF]: CurrencyInfoChf,
  [CurrencyCode.THB]: CurrencyInfoThb,
  [CurrencyCode.BRL]: CurrencyInfoBrl,
  [CurrencyCode.TRY]: CurrencyInfoTry,
  [CurrencyCode.RUB]: CurrencyInfoRub,
  [CurrencyCode.NOK]: CurrencyInfoNok,
  [CurrencyCode.DKK]: CurrencyInfoDkk,
  [CurrencyCode.SEK]: CurrencyInfoSek,
  [CurrencyCode.ILS]: CurrencyInfoIls,
  [CurrencyCode.ZAR]: CurrencyInfoZar,
  [CurrencyCode.PLN]: CurrencyInfoPln,
  [CurrencyCode.PHP]: CurrencyInfoPhp,
  [CurrencyCode.CZK]: CurrencyInfoCzk,
  [CurrencyCode.CLP]: CurrencyInfoClp,
  [CurrencyCode.COP]: CurrencyInfoCop,
  [CurrencyCode.EGP]: CurrencyInfoEgp,
  [CurrencyCode.MYR]: CurrencyInfoMyr,
  [CurrencyCode.HUF]: CurrencyInfoHuf,
  [CurrencyCode.AED]: CurrencyInfoAed,
  [CurrencyCode.SAR]: CurrencyInfoSar,
  [CurrencyCode.RON]: CurrencyInfoRon,
  [CurrencyCode.BGN]: CurrencyInfoBgn,
} as const;