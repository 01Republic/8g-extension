import { CollectWorkflowRequest, CollectWorkflowResult } from './types';
import { EightGError } from './errors';
import { ExtensionResponseMessage, isExtensionResponseMessage } from '@/types/external-messages';
import { z } from 'zod';

// Zod 스키마 정의
/*
{
    name: "01Republic",
    key: "01Republic",
    image: "https://avatars.slack-edge.com/2023-09-18/5909002618259_7d2d9705b28fbbc4a832_88.png"
}
 */
// 1. 이걸로 서브스크립션 생성!
export const WorkspaceItemSchema = z.object({
  // 워크스페이스 이름
  name: z.string(),
  // 워크스페이스를 구분할 수 있는 구분자, ex) slug 같은 것들 01republic
  key: z.string(),
  // 워크스페이스의 프로필 이미지
  image: z.string(),
});

export type WorkspaceItemDto = z.infer<typeof WorkspaceItemSchema>;

export type ConnectWorkspaceResponseDto = {
  data: WorkspaceItemDto[];
  isSuccess: boolean;
};

export enum BillingCycleTerm {
  monthly = 'MONTHLY',
  yearly = 'YEARLY',
}

export const CurrencySchema = z.object({
  // 실제 표시되는 통화 표시
  text: z.string(),
  // 통화 코드
  code: z.string(),
  // 통화 기호
  symbol: z.string(),
  // 통화 표시 형식
  format: z.string(),
  // 통화 금액
  amount: z.number(),
});

export type CurrencyDto = z.infer<typeof CurrencySchema>;

export type CurrencyCodes = ValuesOf<typeof CurrencyValues>['code'];
export type CurrencySymbols = ValuesOf<typeof CurrencyValues>['symbol'];
export type CurrencyFormats = '%u%n';

export type ValuesOf<OBJ> = OBJ[keyof OBJ];

export enum Currency {
  USD = 'USD',
  KRW = 'KRW',
}

export const CurrencyValues = {
  en: {code: 'USD', symbol: '$'},
  ko: {code: 'KRW', symbol: '₩'},
} as const;

/*
{
    "planName": "Pro",
    "currentCycleBillAmount": {
        "text": "US$57.75",
        "code": "USD",
        "symbol": "$",
        "format": "%u%n",
        "amount": 57.75
    },
    "nextPaymentDue": "2025-11-18",
    "cycleTerm": "MONTHLY",
    "isFreeTier": false,
    "isPerUser": false,
    "paidMemberCount": 6,
    "usedMemberCount": 6,
    "unitPrice": {
        "text": "US$52.50",
        "code": "USD",
        "symbol": "$",
        "format": "%u%n",
        "amount": 52.5
    }
}
*/
// 2. subscription 정보 추가! <- 순서는 안정해짐
export const WorkspaceBillingSchema = z.object({
  // 플랜 이름
  planName: z.string(),
  // 현재 주기 결제 금액
  currentCycleBillAmount: CurrencySchema, // 얘는 Scord api 의 money types를 보면 된다!! 그거 가져와서 하기
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
  unitPrice: CurrencySchema.nullable()
  /*
  카드 정보 추가
  number4: string;
  name: string // marster card ~~~~ optional

  ----------------------------
  isPersonal: boolean; // 추가 정보 <- 필수 추가 정보
  isCreditCard: boolean; // 추가 정보 <- 필수 추가 정보

  optional 하게 
  cardNumber: string -> 전체
  name : 가져온거
  유효기간(나중에 컬럼명 찾아서 수정)
  소지자
  비고
  */
});

export type WorkspaceBillingDto = z.infer<typeof WorkspaceBillingSchema> & {
};

/*
[
    {
        "uid": "SBIE-9880723",
        "issuedDate": "2025-10-17T15:00:00.000Z",
        "paidDate": "2025-10-17T15:00:00.000Z",
        "paymentMethod": "Credit Card"
        "amount": {
            "text": "US$38.81",
            "code": "USD",
            "symbol": "$",
            "format": "%u%n",
            "amount": 38.81
        },
        "isSuccessfulPaid": true,
        "receiptUrl": "https://01republic.slack.com/admin/billing/9720939825398/pdf"
    }
*/
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
  amount: CurrencySchema,
  // 결제 성공 여부
  isSuccessfulPaid: z.boolean(),
  // 결제 영수증 링크
  receiptUrl: z.string(),
});

export type WorkspaceBillingHistoryDto = z.infer<typeof WorkspaceBillingHistorySchema>;

/*
[
    {
        "name": "김규리",
        "email": "diana@01republic.io",
        "profileImageUrl": "https://ca.slack-edge.com/T03PSMRQNKV-U052AEE1UVC-91676fc53d54-24",
        "role": "정식 멤버"
    }
]
*/
export const WorkspaceMemberSchema = z.object({
  // 멤버 이름
  name: z.string(),
  // 멤버 이메일
  email: z.string().email(),
  // 멤버 프로필 이미지 링크
  profileImageUrl: z.string(),
  // 멤버 역할
  role: z.string(),
});

export type WorkspaceMemberDto = z.infer<typeof WorkspaceMemberSchema>;

/**
 * 8G Extension SDK Client
 * 웹페이지에서 8G Extension과 통신하기 위한 클라이언트
 */
export class EightGClient {
  constructor() {}

  /**
   * Extension 설치 여부 확인
   */
  async checkExtension(): Promise<ExtensionResponseMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(EightGError.extensionNotInstalled());
      }, 5000);

      const handleResponse = (event: MessageEvent) => {
        if (isExtensionResponseMessage(event.data)) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          resolve(event.data);
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({ type: '8G_EXTENSION_CHECK' }, '*');
    });
  }

  /**
   * 워크플로우 실행 요청
   */
  async collectWorkflow(request: CollectWorkflowRequest): Promise<CollectWorkflowResult> {
    return new Promise((resolve, reject) => {
      const requestId = `8g_wf_${Date.now()}_${Math.random()}`;
      const timeoutMs = request.timeoutMs ?? 600000; // 기본 10분
      const timeout = setTimeout(() => {
        reject(EightGError.requestTimeout(timeoutMs));
      }, timeoutMs);

      const handleResponse = (event: MessageEvent) => {
        if (event.data?.type === '8G_COLLECT_RESPONSE' && event.data.requestId === requestId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);

          const response = event.data as any;
          const steps =
            response?.result?.steps ??
            response?.result?.result?.steps ??
            [];

          resolve({
            success: response.success,
            steps,
            error: response.success ? undefined : 'Workflow failed',
            timestamp: new Date().toISOString(),
            targetUrl: request.targetUrl,
          });
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage({
        type: '8G_COLLECT_WORKFLOW',
        requestId,
        targetUrl: request.targetUrl,
        workflow: request.workflow,
        closeTabAfterCollection: request.closeTabAfterCollection !== false,
        activateTab: request.activateTab === true,
      }, '*');
    });
  }

  async getWorkspaces(request: CollectWorkflowRequest): Promise<ConnectWorkspaceResponseDto & CollectWorkflowResult> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspaces', 'GET_WORKSPACES_FAILED');
    }

    // steps에서 데이터 추출
    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return {
        ...result,
        data: [],
        isSuccess: false,
      };
    }

    // Zod로 각 아이템 검증
    const validatedWorkspaces: WorkspaceItemDto[] = [];
    for (const item of rawData) {
      const parsed = WorkspaceItemSchema.safeParse(item);
      if (parsed.success) {
        validatedWorkspaces.push(parsed.data);
      } else {
        console.warn('Invalid workspace data:', item, parsed.error);
      }
    }

    return {
      ...result,
      data: validatedWorkspaces,
      isSuccess: true,
    };
  }

  // 플랜, 결제주기
  async getWorkspacePlanAndCycle(workspaceKey: string, request: CollectWorkflowRequest): Promise<WorkspaceBillingDto &  CollectWorkflowResult | CollectWorkflowResult> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
    };

    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace plan and cycle', 'GET_WORKSPACE_PLAN_AND_CYCLE_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData) {
      return { ...result };
    }

    const parsed = WorkspaceBillingSchema.safeParse(rawData);
    if (parsed.success) {
      const data = parsed.data as WorkspaceBillingDto;
      return { ...result, ...data };
    } else {
      console.warn('Invalid workspace billing data:', rawData, parsed.error);
      return { ...result };
    }
  }

  // 결제내역
  async getWorkspaceBillingHistories(workspaceKey: string, request: CollectWorkflowRequest): Promise<{ data: WorkspaceBillingHistoryDto[] } & CollectWorkflowResult> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
    };

    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace billing histories', 'GET_WORKSPACE_BILLING_HISTORIES_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return { ...result, data: [] };
    }

    // 배열의 각 아이템 검증
    const validatedHistories: WorkspaceBillingHistoryDto[] = [];
    for (const item of rawData) {
      const parsed = WorkspaceBillingHistorySchema.safeParse(item);
      if (parsed.success) {
        validatedHistories.push(parsed.data);
      } else {
        console.warn('Invalid workspace billing history data:', item, parsed.error);
      }
    }

    return { ...result, data: validatedHistories };
  }

  // 구성원
  async getWorkspaceMembers(workspaceKey: string, request: CollectWorkflowRequest): Promise<{ data: WorkspaceMemberDto[] } & CollectWorkflowResult> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
    };

    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace members', 'GET_WORKSPACE_MEMBERS_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return { ...result, data: [] };
    }

    // 배열의 각 아이템 검증
    const validatedMembers: WorkspaceMemberDto[] = [];
    for (const item of rawData) {
      const parsed = WorkspaceMemberSchema.safeParse(item);
      if (parsed.success) {
        validatedMembers.push(parsed.data);
      } else {
        console.warn('Invalid workspace member data:', item, parsed.error);
      }
    }

    return { ...result, data: validatedMembers };
  }
}
