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
  forEach: string;  // 배열 경로 (예: '$.steps.getIds.result.data')
  continueOnError?: boolean;  // 에러 발생해도 계속 진행
  delayBetween?: number;  // 반복 사이 대기 시간 (ms)
};

export type LoopConfig = {
  count: number | string;  // 반복 횟수 (숫자 또는 바인딩 경로)
  continueOnError?: boolean;  // 에러 발생해도 계속 진행
  delayBetween?: number;  // 반복 사이 대기 시간 (ms)
};

export type RepeatConfig = ForEachConfig | LoopConfig;

export class WorkflowStep {
  id!: string;
  title?: string;
  when?: Condition;
  block?: Block; // BlockBase 호환. 바인딩은 런타임에서 해석
  repeat?: RepeatConfig;  // 반복 설정 (forEach 또는 count)`
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
  vars?: Record<string, any>;  // 워크플로우 초기 변수
  defaultDelayMs?: number;
}

export type CollectWorkflowRequest = {
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
  timeoutMs?: number;  // SDK timeout (기본값: 600000ms = 10분)
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
  amount: number;  // 실제 금액
  text?: string;   // 표시용 텍스트 (예: "US$57.75")
};

/**
 * format
 * %s: symbol
 * %u: amount
 * %n: amount
 *
 * u, n이 섞여있는 휴먼에러 있음.
 */

export const CurrencyList: { [key in CurrencyCode]: CurrencyInfo } = {
  [CurrencyCode.USD]: {
    code: CurrencyCode.USD,
    symbol: '$',
    format: '%s%u',
    desc: 'United States Dollar',
  },
  [CurrencyCode.EUR]: {
    code: CurrencyCode.EUR,
    symbol: '€',
    format: '%s%u',
    desc: 'Euro (European Union)',
  },
  [CurrencyCode.KRW]: {
    code: CurrencyCode.KRW,
    symbol: '₩',
    local: '원',
    format: '%s%u',
    desc: 'South Korean Won',
  },
  [CurrencyCode.GBP]: {
    code: CurrencyCode.GBP,
    symbol: '£',
    format: '%s%u',
    desc: 'British Pound Sterling',
  },
  [CurrencyCode.CAD]: {
    code: CurrencyCode.CAD,
    symbol: '$',
    format: '%s%u',
    desc: 'Canadian Dollar',
  },
  [CurrencyCode.CNY]: {
    code: CurrencyCode.CNY,
    symbol: '¥',
    local: '元',
    format: '%s%u',
    desc: 'Chinese Yuan',
  },
  [CurrencyCode.JPY]: {
    code: CurrencyCode.JPY,
    symbol: '¥',
    local: '円',
    format: '%s%u',
    desc: 'Japanese Yen',
  },
  [CurrencyCode.VND]: {
    code: CurrencyCode.VND,
    symbol: '₫',
    format: '%s%u',
    desc: 'Vietnamese Dong',
  },
  [CurrencyCode.ARS]: {
    code: CurrencyCode.ARS,
    symbol: '$',
    format: '%s%u',
    desc: 'Argentine Peso',
  },
  [CurrencyCode.INR]: {
    code: CurrencyCode.INR,
    symbol: '₹',
    format: '%s%u',
    desc: 'Indian Rupee',
  },
  [CurrencyCode.TWD]: {
    code: CurrencyCode.TWD,
    symbol: 'NT$',
    format: '%s%u',
    desc: 'New Taiwan Dollar',
  },
  [CurrencyCode.AUD]: {
    code: CurrencyCode.AUD,
    symbol: '$',
    format: '%s%u',
    desc: 'Australian Dollar',
  },
  [CurrencyCode.HKD]: {
    code: CurrencyCode.HKD,
    symbol: '$',
    format: '%s%u',
    desc: 'Hong Kong Dollar',
  },
  [CurrencyCode.IDR]: {
    code: CurrencyCode.IDR,
    symbol: 'Rp',
    format: '%s%u',
    desc: 'Indonesian Rupiah',
  },
  [CurrencyCode.MXN]: {
    code: CurrencyCode.MXN,
    symbol: '$',
    format: '%s%u',
    desc: 'Mexican Peso',
  },
  [CurrencyCode.NZD]: {
    code: CurrencyCode.NZD,
    symbol: '$',
    format: '%s%u',
    desc: 'New Zealand Dollar',
  },
  [CurrencyCode.SGD]: {
    code: CurrencyCode.SGD,
    symbol: '$',
    format: '%s%u',
    desc: 'Singapore Dollar',
  },
  [CurrencyCode.CHF]: {
    code: CurrencyCode.CHF,
    symbol: '₣',
    format: '%s%u',
    desc: 'Swiss Franc',
  },
  [CurrencyCode.THB]: {
    code: CurrencyCode.THB,
    symbol: '฿',
    format: '%s%u',
    desc: 'Thai Baht',
  },
  [CurrencyCode.BRL]: {
    code: CurrencyCode.BRL,
    symbol: 'R$',
    format: '%s%u',
    desc: 'Brazilian Real',
  },
  [CurrencyCode.TRY]: {
    code: CurrencyCode.TRY,
    symbol: '₺',
    abbreviation: 'TL',
    format: '%s%u',
    desc: 'Turkish Lira',
  },
  [CurrencyCode.RUB]: {
    code: CurrencyCode.RUB,
    symbol: '₽',
    format: '%s%u',
    desc: 'Russian Ruble',
  },
  [CurrencyCode.NOK]: {
    code: CurrencyCode.NOK,
    symbol: 'kr',
    format: '%s%u',
    desc: 'Norwegian Krone',
  },
  [CurrencyCode.DKK]: {
    code: CurrencyCode.DKK,
    symbol: 'kr',
    format: '%s%u',
    desc: 'Danish Krone',
  },
  [CurrencyCode.SEK]: {
    code: CurrencyCode.SEK,
    symbol: 'kr',
    format: '%s%u',
    desc: 'Swedish Krona',
  },
  [CurrencyCode.ILS]: {
    code: CurrencyCode.ILS,
    symbol: '₪',
    format: '%s%u',
    desc: 'Israeli New Shekel',
  },
  [CurrencyCode.ZAR]: {
    code: CurrencyCode.ZAR,
    symbol: 'R',
    format: '%s%u',
    desc: 'South African Rand',
  },
  [CurrencyCode.PLN]: {
    code: CurrencyCode.PLN,
    symbol: 'zł',
    format: '%s%u',
    desc: 'Polish Zloty',
  },
  [CurrencyCode.PHP]: {
    code: CurrencyCode.PHP,
    symbol: '₱',
    format: '%s%u',
    desc: 'Philippine Peso',
  },
  [CurrencyCode.CZK]: {
    code: CurrencyCode.CZK,
    symbol: 'Kč',
    format: '%s%u',
    desc: 'Czech Koruna',
  },
  [CurrencyCode.CLP]: {
    code: CurrencyCode.CLP,
    symbol: '$',
    format: '%s%u',
    desc: 'Chilean Peso',
  },
  [CurrencyCode.COP]: {
    code: CurrencyCode.COP,
    symbol: '$',
    format: '%s%u',
    desc: 'Colombian Peso',
  },
  [CurrencyCode.EGP]: {
    code: CurrencyCode.EGP,
    symbol: 'E£',
    format: '%s%u',
    desc: 'Egyptian Pound',
  },
  [CurrencyCode.MYR]: {
    code: CurrencyCode.MYR,
    symbol: 'RM',
    local: '令吉',
    format: '%s%u',
    desc: 'Malaysian Ringgit',
  },
  [CurrencyCode.HUF]: {
    code: CurrencyCode.HUF,
    symbol: 'Ft',
    format: '%s%u',
    desc: 'Hungarian Forint',
  },
  [CurrencyCode.AED]: {
    code: CurrencyCode.AED,
    symbol: 'د.إ',
    format: '%s%u',
    desc: 'United Arab Emirates Dirham',
  },
  [CurrencyCode.SAR]: {
    code: CurrencyCode.SAR,
    symbol: '﷼',
    format: '%s%u',
    desc: 'Saudi Riyal',
  },
  [CurrencyCode.RON]: {
    code: CurrencyCode.RON,
    symbol: 'L',
    local: 'lei',
    format: '%s%u',
    desc: 'Romanian Leu',
  },
  [CurrencyCode.BGN]: {
    code: CurrencyCode.BGN,
    symbol: 'лв',
    format: '%s%u',
    desc: 'Bulgarian Lev',
  },
};

export const DefaultCurrency = {
  code: CurrencyCode.USD,
  symbol: '$',
  format: '%u%n',
};
