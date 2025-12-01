import { Block } from '../blocks';
import type {
  StepResult as WorkflowStepResult,
  ForEachContext as WorkflowForEachContext,
  CountLoopContext as WorkflowCountLoopContext,
} from '../workflow/context/execution-context';
import { z } from 'zod';

export * from '../blocks';

// =========================
// Execution Context Types
// =========================

// Re-export types from workflow for reference
export type { StepResult } from '../workflow/context/execution-context';

/**
 * SDK용 ExecutionContext (플레인 객체)
 *
 * workflow의 ExecutionContext를 평면화한 구조입니다.
 * WorkflowService에서 toPlainObject()로 변환하여 전달됩니다.
 */
export interface ExecutionContext {
  steps: Record<string, WorkflowStepResult>;
  vars: Record<string, any>;
  forEach?: WorkflowForEachContext;
  loop?: WorkflowCountLoopContext;
}

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

export type RepeatScope = 'block' | 'subtree';

type RepeatBase = {
  continueOnError?: boolean; // 에러 발생해도 계속 진행
  delayBetween?: number; // 반복 사이 대기 시간 (ms)
  scope?: RepeatScope; // 반복 대상: 기본 block, subtree 지원
  subtreeEnd?: string; // scope=subtree일 때 반복 범위 종료 지점
};

export type ForEachConfig = RepeatBase & {
  forEach: string; // 배열 경로 (예: '$.steps.getIds.result.data')
  count?: never;
};

export type LoopConfig = RepeatBase & {
  count: number | string; // 반복 횟수 (숫자 또는 바인딩 경로)
  forEach?: never;
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
  version!: string;
  id?: string;
  title?: string;
  description?: string;
  start!: string;
  steps!: WorkflowStep[];
  vars?: Record<string, any>; // 워크플로우 초기 변수
  defaultDelayMs?: number;
  workflowType?: string; // 워크플로우 타입 (예: 'getWorkspaces')
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
  data!: ResDataContainer<T>;
  steps!: WorkflowStepRunResult<T>[];
  context!: ExecutionContext;
  targetUrl!: string;
  timestamp!: string;
  error?: string;
}

export class CollectWorkflowArrayResult<T = any> {
  success!: boolean;
  data!: ResDataContainer<T>[]; // 항상 배열
  steps!: WorkflowStepRunResult<T>[];
  context!: ExecutionContext;
  targetUrl!: string;
  timestamp!: string;
  error?: string;
}

export class ResDataContainer<T = any> {
  success!: boolean;
  message?: string;
  data?: T;
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

/**
 * 금액 정보를 포함하는 통화 타입
 * format: %s (symbol), %u (amount), %n (amount) - u, n이 섞여있는 휴먼에러 있음
 */
export type CurrencyInfo = {
  code: string;
  symbol: string;
  format: string;
  amount: number; // 실제 금액
  text?: string; // 표시용 텍스트 (예: "US$57.75")
};

/**
 * 단일 통화 스키마 객체
 * code, symbol, format, amount, text 필드만 포함
 */
export const CurrencyInfoSchema = {
  code: {
    type: 'string' as const,
    enum: Object.values(CurrencyCode),
    description: 'Currency code',
  },
  symbol: {
    type: 'string' as const,
    enum: [
      '$',
      '₩',
      '€',
      '£',
      '¥',
      '₫',
      '₹',
      'NT$',
      'Rp',
      '₣',
      '฿',
      'R$',
      '₺',
      '₽',
      'kr',
      '₪',
      'R',
      'zł',
      '₱',
      'Kč',
      'E£',
      'RM',
      'Ft',
      'د.إ',
      '﷼',
      'L',
      'лв',
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
// Workspace Types & Schemas
// =========================

export enum BillingCycleTerm {
  None = 'None',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Onetime = 'Onetime',
}

// Workspace Item (워크스페이스 목록)
export const WorkspaceItemSchema = z.object({
  // 워크스페이스를 구분할 수 있는 구분자
  id: z.string(),
  // 워크스페이스 슬러그
  slug: z.string(),
  // 워크스페이스 이름
  name: z.string(),
  // 워크스페이스의 프로필 이미지
  image: z.string(),
  // member 수
  memberCount: z.number(),
  // 관리자 여부
  isAdmin: z.boolean().nullable().optional(),
});

export type WorkspaceItemDto = z.infer<typeof WorkspaceItemSchema>;

// Workspace Detail (워크스페이스 상세)
export const WorkspaceDetailItemSchema = z.object({
  // 워크스페이스를 구분할 수 있는 구분자, ex) slug 같은 것들 01republic
  slug: z.string(),
  // 워크스페이스 이름
  displayName: z.string(),
  // 워크스페이스의 프로필 이미지
  profileImageUrl: z.string(),
  // 설명
  description: z.string(),
  // 공개 이메일
  publicEmail: z.string(),
  // 결제 이메일
  billingEmail: z.string(),
  // 조직 메인 페이지 URL
  orgPageUrl: z.string(),
  // 워크스페이스 역할 목록
  roles: z.array(z.string()),
  // 워크스페이스 초대 가능 한 역할 목록
  invitableRoles: z.array(z.string()).nullable().optional(),
});

export type WorkspaceDetailItemDto = z.infer<typeof WorkspaceDetailItemSchema>;

// Currency Amount (통화 정보)
export const CurrencyAmountSchema = z.object({
  // 통화 코드
  code: z.nativeEnum(CurrencyCode),
  // 통화 기호
  symbol: z.string(),
  // 통화 표시 형식
  format: z.string(),
  // 실제 금액
  amount: z.number(),
  // 표시용 텍스트 (optional, 예: "US$57.75")
  text: z.string().optional(),
});

export type CurrencyDto = z.infer<typeof CurrencyAmountSchema>;

// Workspace Billing (워크스페이스 결제 정보)
export const WorkspaceBillingSchema = z.object({
  // 플랜 이름
  planName: z.string(),
  // 현재 주기 결제 금액
  currentCycleBillAmount: CurrencyAmountSchema,
  // 다음 결제 예정일
  nextPaymentDue: z.string(),
  // 주기 단위
  cycleTerm: z.nativeEnum(BillingCycleTerm).nullable(),
  // 무료 티어 여부
  isFreeTier: z.boolean(),
  // 플랜 단위 여부
  isPerUser: z.boolean(),
  // 결제 멤버 수
  paidMemberCount: z.number(),
  // 사용 멤버 수
  usedMemberCount: z.number(),
  // 단위 가격
  unitPrice: CurrencyAmountSchema.nullable(),
  // 카드 번호
  cardNumber: z.string(),
  // 카드 이름
  cardName: z.string(),
});

export type WorkspaceBillingDto = z.infer<typeof WorkspaceBillingSchema>;

// Workspace Billing History (워크스페이스 결제 내역)
export const WorkspaceBillingHistorySchema = z.object({
  // 결제 이력 고유 아이디
  uid: z.string(),
  // 결제 일자
  issuedDate: z.coerce.date(),
  // 결제 완료 일자
  paidDate: z.coerce.date().nullable().optional(),
  // 결제 방법
  paymentMethod: z.string(),
  // 결제 금액
  amount: CurrencyAmountSchema,
  // 결제 성공 여부
  isSuccessfulPaid: z.boolean(),
  // 결제 영수증 링크
  receiptUrl: z.string(),
});

export type WorkspaceBillingHistoryDto = z.infer<typeof WorkspaceBillingHistorySchema>;

// Workspace Member (워크스페이스 멤버)
export const WorkspaceMemberSchema = z.object({
  uid: z.string().nullable(),
  // 멤버 이름
  name: z.string(),
  // 멤버 이메일
  email: z.string().email(),
  // 멤버 프로필 이미지 링크
  profileImageUrl: z.string(),
  // 멤버 역할
  role: z.string(),
  // 멤버 구독 좌석 상태
  subscriptionSeatStatus: z
    .enum([
      'NONE', // 미정
      'FREE', // 무료
      'PAID', // 유료
      'QUIT', // 해지
    ])
    .nullable()
    .optional(),
  // 멤버 가입 일자
  startedAt: z.coerce.date().nullable().optional(),
  // 멤버 해지 일자
  deletedAt: z.coerce.date().nullable().optional(),
});

export type WorkspaceMemberDto = z.infer<typeof WorkspaceMemberSchema>;

// Member Operation Result (멤버 조작 결과)
export const MemberOperationResultSchema = z.object({
  email: z.string(),
  operation: z.enum(['add', 'delete']),
  completed: z.boolean(),
  reason: z.string().optional(),
});

export interface MemberOperationResult {
  email: string;
  operation: 'add' | 'delete';
  completed: boolean;
  reason?: string;
}
