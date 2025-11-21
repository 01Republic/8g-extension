import {
  CollectWorkflowRequest,
  CollectWorkflowResult,
  CurrencyCode,
  ExecutionContext,
  ResDataContainer,
} from './types';
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
});

export type WorkspaceDetailItemDto = z.infer<typeof WorkspaceDetailItemSchema>;

export enum BillingCycleTerm {
  None = 'None',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
  Onetime = 'Onetime',
}

/**
 * CurrencyAmount 타입을 위한 Zod 스키마
 * types.ts의 CurrencyAmount와 동일한 구조
 */
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

export type WorkspaceBillingDto = z.infer<typeof WorkspaceBillingSchema> & {};

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
  amount: CurrencyAmountSchema,
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
          const steps = response?.result?.steps ?? response?.result?.result?.steps ?? [];
          const context = response?.result?.context ??
            response?.result?.result?.context ?? { steps: {}, vars: {} };

          const data = steps[steps.length - 1]?.result?.data;

          let resContainer: ResDataContainer | ResDataContainer[];
          if (Array.isArray(data)) {
            resContainer = data.map((item) => ({
              success: response.success,
              message: response.message,
              data: item,
            }));
          } else {
            resContainer = {
              success: response.success,
              message: response.message,
              data: data,
            };
          }

          resolve({
            success: response.success,
            data: resContainer,
            steps,
            context,
            error: response.success ? undefined : 'Workflow failed',
            timestamp: new Date().toISOString(),
            targetUrl: request.targetUrl,
          });
        }
      };

      window.addEventListener('message', handleResponse);
      window.postMessage(
        {
          type: '8G_COLLECT_WORKFLOW',
          requestId,
          targetUrl: request.targetUrl,
          workflow: request.workflow,
          closeTabAfterCollection: request.closeTabAfterCollection !== false,
          activateTab: request.activateTab === true,
        },
        '*'
      );
    });
  }

  async getWorkspaces(
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult<WorkspaceItemDto[]>> {
    return this.executeWorkflowAndValidate(
      request,
      WorkspaceItemSchema,
      'GET_WORKSPACES_FAILED',
      'Failed to get workspaces',
      true
    ) as Promise<CollectWorkflowResult<WorkspaceItemDto[]>>;
  }

  // 워크스페이스 상세
  async getWorkspaceDetail(
    workspaceKey: string,
    slug: string,
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult<WorkspaceDetailItemDto>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
    };

    return this.executeWorkflowAndValidate(
      request,
      WorkspaceDetailItemSchema,
      'GET_WORKSPACE_DETAIL_FAILED',
      'Failed to get workspace detail',
      false
    ) as Promise<CollectWorkflowResult<WorkspaceDetailItemDto>>;
  }

  // 플랜, 결제주기
  async getWorkspaceBilling(
    workspaceKey: string,
    slug: string,
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult<WorkspaceBillingDto>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
    };

    return this.executeWorkflowAndValidate(
      request,
      WorkspaceBillingSchema,
      'GET_WORKSPACE_BILLING_FAILED',
      'Failed to get workspace billing',
      false
    ) as Promise<CollectWorkflowResult<WorkspaceBillingDto>>;
  }

  // 결제내역
  async getWorkspaceBillingHistories(
    workspaceKey: string,
    slug: string,
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult<WorkspaceBillingHistoryDto[]>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
    };

    return this.executeWorkflowAndValidate(
      request,
      WorkspaceBillingHistorySchema,
      'GET_WORKSPACE_BILLING_HISTORIES_FAILED',
      'Failed to get workspace billing histories',
      true
    ) as Promise<CollectWorkflowResult<WorkspaceBillingHistoryDto[]>>;
  }

  // 구성원
  async getWorkspaceMembers(
    workspaceKey: string,
    slug: string,
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult<WorkspaceMemberDto[]>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
    };

    return this.executeWorkflowAndValidate(
      request,
      WorkspaceMemberSchema,
      'GET_WORKSPACE_MEMBERS_FAILED',
      'Failed to get workspace members',
      true
    ) as Promise<CollectWorkflowResult<WorkspaceMemberDto[]>>;
  }

  async addMembers(
    workspaceKey: string,
    slug: string,
    emails: string[],
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
      emails,
    };

    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to add sheets', 'ADD_SHEETS_FAILED');
    }

    return { ...result };
  }

  async deleteMembers(
    workspaceKey: string,
    slug: string,
    emails: string[],
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowResult> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
      emails,
    };

    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to delete members', 'DELETE_MEMBERS_FAILED');
    }

    return { ...result };
  }

  static getFromContext(context: ExecutionContext, path: string): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  static getStepResult(context: ExecutionContext, stepId: string): any {
    return context.steps[stepId];
  }

  static getStepData(context: ExecutionContext, stepId: string): any {
    return context.steps[stepId]?.result?.data;
  }

  static getVar(context: ExecutionContext, varKey: string): any {
    return context.vars[varKey];
  }

  /**
   * 공통 워크플로우 실행 및 데이터 검증 로직
   */
  private async executeWorkflowAndValidate<T>(
    request: CollectWorkflowRequest,
    schema: z.ZodSchema<T>,
    errorCode: string,
    errorMessage: string,
    isArray: boolean = false
  ): Promise<CollectWorkflowResult<T | T[]>> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError(errorMessage, errorCode);
    }

    // steps에서 데이터 추출
    const rawData = result.data;

    if (!rawData) {
      return {
        ...result,
        data: isArray ? ([] as T[]) : undefined,
      } as CollectWorkflowResult<T | T[]>;
    }

    if (isArray) {
      if (!Array.isArray(rawData)) {
        return {
          ...result,
          data: [] as T[],
        } as CollectWorkflowResult<T[]>;
      }

      // 배열의 각 아이템 검증
      const validatedItems: ResDataContainer<T>[] = [];
      for (const item of rawData) {
        const parsed = schema.safeParse(item.data);
        if (parsed.success) {
          validatedItems.push({
            success: item.success,
            message: item.message,
            data: parsed.data,
          });
        } else {
          console.warn(`Invalid data:`, item, parsed.error);
          validatedItems.push({
            success: false,
            message: parsed.error.message,
            data: undefined,
          });
        }
      }

      return {
        ...result,
        data: validatedItems,
      } as CollectWorkflowResult<T[]>;
    } else {
      // 단일 객체 검증
      const parsed = schema.safeParse(rawData);
      if (parsed.success) {
        return {
          ...result,
          data: parsed.data,
        } as CollectWorkflowResult<T>;
      } else {
        console.warn(`Invalid data:`, rawData, parsed.error);
        return {
          ...result,
          data: {
            ...rawData,
            success: false,
            message: 'Invalid data',
          },
        } as CollectWorkflowResult<T>;
      }
    }
  }
}
