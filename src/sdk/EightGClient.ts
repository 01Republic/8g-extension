import { CollectWorkflowRequest, CollectWorkflowResult } from './types';
import { EightGError } from './errors';
import { ExtensionResponseMessage, isExtensionResponseMessage } from '@/types/external-messages';
import { plainToInstance, Type } from 'class-transformer';
import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, IsDate, ValidateNested, validateSync, IsEmail } from 'class-validator';

export class WorkspaceItemDto {
  @IsString()
  name!: string; // 서비스 내 조직 이름

  @IsString()
  key!: string; // 목록에서 조직을 선택하기 위한 식별자 (slug 성격)

  @IsString()
  image!: string; // 이미지
}

export type ConnectWorkspaceResponseDto = {
  data: WorkspaceItemDto[];
  isSuccess: boolean;
};

export enum BillingCycleTerm {
  monthly = 'MONTHLY',
  yearly = 'YEARLY',
}

export class CurrencyDto {
  @IsString()
  text!: string;

  @IsString()
  code!: CurrencyCodes;

  @IsString()
  symbol!: CurrencySymbols;

  @IsString()
  format!: CurrencyFormats;

  @IsNumber()
  amount!: number;
}

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


export class WorkspaceBillingDto {
  @IsString()
  planName!: string;

  @ValidateNested()
  @Type(() => CurrencyDto)
  currentCycleBillAmount!: CurrencyDto;

  @IsString()
  nextPaymentDue!: string;

  @IsOptional()
  @IsEnum(BillingCycleTerm)
  cycleTerm!: BillingCycleTerm | null;

  @IsBoolean()
  isFreeTier!: boolean;

  @IsBoolean()
  isPerUser!: boolean;

  @IsNumber()
  paidMemberCount!: number;

  @IsNumber()
  usedMemberCount!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyDto)
  unitPrice!: CurrencyDto | null;
}

export class WorkspaceBillingHistoryDto {
  @IsString()
  uid!: string;

  @IsDate()
  @Type(() => Date)
  issuedDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidDate?: Date | null;

  @IsString()
  paymentMethod!: string;

  @ValidateNested()
  @Type(() => CurrencyDto)
  amount!: CurrencyDto;

  @IsBoolean()
  isSuccessfulPaid!: boolean;

  @IsString()
  receiptUrl!: string;
}

export class WorkspaceMemberDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  profileImageUrl!: string;

  @IsString()
  role!: string;
}

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

    // plainToInstance로 데이터를 WorkspaceItemDto 클래스 인스턴스로 변환
    const workspaces = plainToInstance(WorkspaceItemDto, rawData);

    // class-validator로 각 아이템 검증
    const validatedWorkspaces: WorkspaceItemDto[] = [];
    for (const workspace of workspaces) {
      const errors = validateSync(workspace);
      if (errors.length === 0) {
        validatedWorkspaces.push(workspace);
      } else {
        console.warn('Invalid workspace data:', workspace, errors);
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

      const workspaceBilling = plainToInstance(WorkspaceBillingDto, rawData);

      const errors = validateSync(workspaceBilling);
      if (errors.length === 0) {
        return workspaceBilling;
      } else {
        console.warn('Invalid workspace billing data:', workspaceBilling, errors);
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

      const workspaceBillingHistories = plainToInstance(WorkspaceBillingHistoryDto, rawData);

      // 배열의 각 아이템 검증
      const validatedHistories: WorkspaceBillingHistoryDto[] = [];
      for (const history of workspaceBillingHistories) {
        const errors = validateSync(history);
        if (errors.length === 0) {
          validatedHistories.push(history);
        } else {
          console.warn('Invalid workspace billing history data:', history, errors);
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

      const workspaceMembers = plainToInstance(WorkspaceMemberDto, rawData);

      // 배열의 각 아이템 검증
      const validatedMembers: WorkspaceMemberDto[] = [];
      for (const member of workspaceMembers) {
        const errors = validateSync(member);
        if (errors.length === 0) {
          validatedMembers.push(member);
        } else {
          console.warn('Invalid workspace member data:', member, errors);
        }
      }

      return validatedMembers;
    }
}