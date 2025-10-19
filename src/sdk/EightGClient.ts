import { CollectWorkflowRequest, CollectWorkflowResult } from './types';
import { EightGError } from './errors';
import { ExtensionResponseMessage, isExtensionResponseMessage } from '@/types/external-messages';
import { z } from 'zod';

// Zod 스키마 정의
export const WorkspaceItemSchema = z.object({
  name: z.string(),
  key: z.string(),
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
  text: z.string(),
  code: z.string(),
  symbol: z.string(),
  format: z.string(),
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

export const WorkspaceBillingSchema = z.object({
  planName: z.string(),
  currentCycleBillAmount: CurrencySchema,
  nextPaymentDue: z.string(),
  cycleTerm: z.nativeEnum(BillingCycleTerm).nullable(),
  isFreeTier: z.boolean(),
  isPerUser: z.boolean(),
  paidMemberCount: z.number(),
  usedMemberCount: z.number(),
  unitPrice: CurrencySchema.nullable()
});

export type WorkspaceBillingDto = z.infer<typeof WorkspaceBillingSchema> & {
};

export const WorkspaceBillingHistorySchema = z.object({
  uid: z.string(),
  issuedDate: z.coerce.date(),
  paidDate: z.coerce.date().nullable().optional(),
  paymentMethod: z.string(),
  amount: CurrencySchema,
  isSuccessfulPaid: z.boolean(),
  receiptUrl: z.string(),
});

export type WorkspaceBillingHistoryDto = z.infer<typeof WorkspaceBillingHistorySchema>;

export const WorkspaceMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  profileImageUrl: z.string(),
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

  async getWorkspaces(request: CollectWorkflowRequest): Promise<ConnectWorkspaceResponseDto> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspaces', 'GET_WORKSPACES_FAILED');
    }

    // steps에서 데이터 추출
    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return {
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
      data: validatedWorkspaces,
      isSuccess: true,
    };
  }

  // 플랜, 결제주기
  async getWorkspacePlanAndCycle(request: CollectWorkflowRequest): Promise<WorkspaceBillingDto | null> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace plan and cycle', 'GET_WORKSPACE_PLAN_AND_CYCLE_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData) {
      return null;
    }

    const parsed = WorkspaceBillingSchema.safeParse(rawData);
    if (parsed.success) {
      const data = parsed.data as WorkspaceBillingDto;
      return data;
    } else {
      console.warn('Invalid workspace billing data:', rawData, parsed.error);
      return null;
    }
  }

  // 결제내역
  async getWorkspaceBillingHistories(request: CollectWorkflowRequest): Promise<WorkspaceBillingHistoryDto[]> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace billing histories', 'GET_WORKSPACE_BILLING_HISTORIES_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return [];
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

    return validatedHistories;
  }

  // 구성원
  async getWorkspaceMembers(request: CollectWorkflowRequest): Promise<WorkspaceMemberDto[]> {
    const result = await this.collectWorkflow(request);
    if (!result.success) {
      throw new EightGError('Failed to get workspace members', 'GET_WORKSPACE_MEMBERS_FAILED');
    }

    const rawData = result.steps[result.steps.length - 1]?.result?.data;
    if (!rawData || !Array.isArray(rawData)) {
      return [];
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

    return validatedMembers;
  }
}
