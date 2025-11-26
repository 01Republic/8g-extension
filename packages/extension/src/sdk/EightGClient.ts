import {
  CollectWorkflowRequest,
  CollectWorkflowResult,
  CollectWorkflowArrayResult,
  ExecutionContext,
  ResDataContainer,
  MemberOperationResult,
  MemberOperationResultSchema,
  WorkspaceItemSchema,
  WorkspaceItemDto,
  WorkspaceDetailItemSchema,
  WorkspaceDetailItemDto,
  WorkspaceBillingSchema,
  WorkspaceBillingDto,
  WorkspaceBillingHistorySchema,
  WorkspaceBillingHistoryDto,
  WorkspaceMemberSchema,
  WorkspaceMemberDto,
} from './types';
import { EightGError } from './errors';
import { ExtensionResponseMessage, isExtensionResponseMessage } from '@/types/external-messages';
import { z } from 'zod';

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

          console.log('steps', steps);

          // 워크플로우 전체 성공 여부 판단: 모든 step이 성공하거나 skipped여야 함
          const allStepsSuccessful =
            steps.length > 0 && steps.every((step: any) => step.success || step.skipped);
          console.log('allStepsSuccessful', allStepsSuccessful);

          // 실패한 step이 있다면 그 에러 정보 수집, 없으면 마지막 step의 data 사용
          const failedStep = steps.find((step: any) => !step.success && !step.skipped);
          console.log('failedStep', failedStep);

          const data = failedStep ? failedStep.result?.data : steps[steps.length - 1]?.result?.data;
          console.log('data', data);

          const resContainer = {
            success: allStepsSuccessful,
            message: failedStep ? failedStep.message : response.message,
            data: data,
          };
          console.log('resContainer', resContainer);

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
    // 워크플로우 타입을 getWorkspaces로 설정
    request.workflow.workflowType = 'getWorkspaces';
    
    return this.executeWorkflowAndValidateSingleContainer(
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

    return this.executeWorkflowAndValidateSingleContainer(
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

    return this.executeWorkflowAndValidateSingleContainer(
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

    return this.executeWorkflowAndValidateSingleContainer(
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

    return this.executeWorkflowAndValidateSingleContainer(
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
  ): Promise<CollectWorkflowArrayResult<MemberOperationResult>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
      emails,
    };

    const result = await this.collectWorkflow(request);

    // 워크플로우 자체가 실패한 경우에만 에러 throw
    // 개별 멤버 실패는 data 배열에서 처리
    if (!result.success && result.error) {
      throw new EightGError(result.error, 'ADD_MEMBERS_WORKFLOW_FAILED');
    }

    return this.executeWorkflowAndValidateMultipleContainers<MemberOperationResult>(
      result,
      MemberOperationResultSchema,
      this.isMemberOperationResultArray.bind(this),
      this.isMemberOperationResult.bind(this)
    );
  }

  async deleteMembers(
    workspaceKey: string,
    slug: string,
    emails: string[],
    request: CollectWorkflowRequest
  ): Promise<CollectWorkflowArrayResult<MemberOperationResult>> {
    request.workflow.vars = {
      ...request.workflow.vars,
      workspaceKey,
      slug,
      emails,
    };

    const result = await this.collectWorkflow(request);

    // 워크플로우 자체가 실패한 경우에만 에러 throw
    // 개별 멤버 실패는 data 배열에서 처리
    if (!result.success && result.error) {
      throw new EightGError(result.error, 'DELETE_MEMBERS_WORKFLOW_FAILED');
    }

    // 🎯 여기서만 변환!
    return this.executeWorkflowAndValidateMultipleContainers<MemberOperationResult>(
      result,
      MemberOperationResultSchema,
      this.isMemberOperationResultArray.bind(this),
      this.isMemberOperationResult.bind(this)
    );
  }

  // MemberOperationResult 타입 가드 함수들
  private isMemberOperationResult(obj: any): obj is MemberOperationResult {
    return (
      obj &&
      typeof obj.email === 'string' &&
      ['add', 'delete'].includes(obj.operation) &&
      typeof obj.completed === 'boolean'
    );
  }

  private isMemberOperationResultArray(obj: any): obj is MemberOperationResult[] {
    return (
      Array.isArray(obj) &&
      obj.length > 0 &&
      obj.every((item) => this.isMemberOperationResult(item))
    );
  }

  // 다중 컨테이너 워크플로우 실행 및 검증 함수
  // ResDataContainer<T>[] 반환 (멤버 조작 전용)
  private executeWorkflowAndValidateMultipleContainers<T>(
    result: CollectWorkflowResult<any>,
    schema: z.ZodSchema<T>,
    isArrayCheck: (obj: any) => obj is T[],
    isSingleCheck: (obj: any) => obj is T
  ): CollectWorkflowArrayResult<T> {
    // 워크플로우 마지막 성공한 스텝에서 데이터 추출
    const lastStep = result.steps[result.steps.length - 1];
    const rawData = lastStep?.result?.data;

    if (isArrayCheck(rawData)) {
      // 배열인 경우: 각각을 ResDataContainer로 래핑하고 스키마 검증
      const validatedItems: ResDataContainer<T>[] = [];
      for (const item of rawData) {
        const parsed = schema.safeParse(item);
        if (parsed.success) {
          validatedItems.push({
            success: true,
            data: parsed.data,
          });
        } else {
          console.warn(`Invalid data:`, item, parsed.error);
          validatedItems.push({
            success: false,
            message: 'Data validation failed',
            data: item, // 원본 데이터는 유지하되 success: false
          });
        }
      }
      return {
        ...result,
        data: validatedItems,
      } as CollectWorkflowArrayResult<T>;
    }

    if (isSingleCheck(rawData)) {
      // 단일 객체인 경우: 배열로 만들어서 래핑하고 스키마 검증
      const parsed = schema.safeParse(rawData);
      return {
        ...result,
        data: [
          {
            success: parsed.success,
            message: parsed.success ? undefined : 'Data validation failed',
            data: parsed.success ? parsed.data : rawData,
          },
        ],
      } as CollectWorkflowArrayResult<T>;
    }

    // 기본 fallback: 빈 배열
    return {
      ...result,
      data: [],
    } as CollectWorkflowArrayResult<T>;
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
   * 단일 컨테이너 워크플로우 실행 및 데이터 검증 로직
   * ResDataContainer<T> 또는 ResDataContainer<T[]> 반환
   */
  private async executeWorkflowAndValidateSingleContainer<T>(
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
        data: isArray ? { success: false, data: [] as T[] } : { success: false, data: undefined },
      } as CollectWorkflowResult<T | T[]>;
    }

    if (isArray) {
      // 배열 처리 - ResDataContainer<T[]>
      if ((rawData as any)?.data && Array.isArray((rawData as any).data)) {
        // ResDataContainer 구조: { success: true, data: [...] }
        const container = rawData as ResDataContainer<T[]>;
        const validatedItems: T[] = [];

        if (container.data) {
          for (const item of container.data) {
            const parsed = schema.safeParse(item);
            if (parsed.success) {
              validatedItems.push(parsed.data);
            } else {
              console.warn(`Invalid data:`, item, parsed.error);
            }
          }
        }

        return {
          ...result,
          data: {
            ...container,
            data: validatedItems,
          },
        } as CollectWorkflowResult<T[]>;
      }

      // 일반 배열 형태 처리
      if (!Array.isArray(rawData)) {
        return {
          ...result,
          data: { success: false, data: [] as T[] },
        } as CollectWorkflowResult<T[]>;
      }

      const validatedItems: T[] = [];
      for (const item of rawData) {
        const itemData = (item as any)?.data !== undefined ? (item as any).data : item;
        const parsed = schema.safeParse(itemData);
        if (parsed.success) {
          validatedItems.push(parsed.data);
        } else {
          console.warn(`Invalid data:`, item, parsed.error);
        }
      }

      return {
        ...result,
        data: { success: true, data: validatedItems },
      } as CollectWorkflowResult<T[]>;
    } else {
      // 단일 객체 검증 - ResDataContainer<T>
      if ((rawData as any)?.data !== undefined && (rawData as any)?.success !== undefined) {
        // ResDataContainer 구조: { success: true, data: {...} }
        const container = rawData as ResDataContainer<any>;
        const parsed = schema.safeParse(container.data);
        if (parsed.success) {
          return {
            ...result,
            data: {
              ...container,
              data: parsed.data,
            },
          } as CollectWorkflowResult<T>;
        } else {
          console.warn(`Invalid data:`, container, parsed.error);
          return {
            ...result,
            data: {
              ...container,
              data: undefined,
            },
          } as CollectWorkflowResult<T>;
        }
      } else {
        // 직접 데이터가 온 경우 - ResDataContainer로 래핑
        const parsed = schema.safeParse(rawData);
        if (parsed.success) {
          return {
            ...result,
            data: {
              success: true,
              data: parsed.data,
            },
          } as CollectWorkflowResult<T>;
        } else {
          console.warn(`Invalid data:`, rawData, parsed.error);
          return {
            ...result,
            data: {
              success: false,
              message: 'Data validation failed',
              data: undefined,
            },
          } as CollectWorkflowResult<T>;
        }
      }
    }
  }
}
