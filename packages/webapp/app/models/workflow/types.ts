import type { Edge } from "@xyflow/react";

/**
 * Switch 조건식 타입
 */
export interface WhenCondition {
  // 표현식 문자열
  expr?: string;
  // JSON 조건식
  equals?: { left: string; right: any };
  exists?: string;
  regex?: { value: string; pattern: string };
  contains?: { value: string; search: string };
  // 복합 조건
  and?: WhenCondition[];
  or?: WhenCondition[];
}

/**
 * Edge에 저장되는 조건 데이터
 */
export interface SwitchEdgeData extends Record<string, unknown> {
  // 조건부 분기를 위한 when 조건
  when?: WhenCondition;
  // 기본 분기인지 여부 (조건 없는 next)
  isDefault?: boolean;
  // Edge 라벨 (조건 표시용)
  conditionLabel?: string;
}

/**
 * 워크플로우에서 사용하는 Edge 타입
 */
export type WorkflowEdge = Edge<SwitchEdgeData>;

import type { WorkflowStep } from "scordi-extension";

export type FormWorkflow = {
  version: string;
  start: string;
  steps: WorkflowStep[];
  targetUrl?: string;
  vars?: Record<string, any>;
};

export type WorkspaceSelectSectionSchema = {
  type: "workspace-select";
  title: string;
  placeholder: string;
  workflow: FormWorkflow;
  workflowId?: number;
};

export type MemberTableSectionSchema = {
  type: "member-table";
  title: string;
  workflow: FormWorkflow;
  workflowId?: number;
};

export type PaymentInfoSectionSchema = {
  type: "payment-info";
  title: string;
  workflow: FormWorkflow;
  workflowId?: number;
};

export type PaymentHistorySectionSchema = {
  type: "payment-history";
  title: string;
  workflow: FormWorkflow;
  workflowId?: number;
};

export type PermissionCheckSectionSchema = {
  type: "permission-check";
  title: string;
  placeholder: string;
  loadingMessage: string;
  errorMessage: string;
  successMessage: string;
  workflow: FormWorkflow;
  workflowId?: number;
};

export type InitialCheckSectionSchema = {
  type: "initial-check";
  title: string;
};

export type CompletionSectionSchema = {
  type: "completion";
  title: string;
};

export type FormSectionSchema =
  | WorkspaceSelectSectionSchema
  | MemberTableSectionSchema
  | PaymentInfoSectionSchema
  | PaymentHistorySectionSchema
  | PermissionCheckSectionSchema
  | InitialCheckSectionSchema
  | CompletionSectionSchema;

export type AppFormSectionMeta = {
  id: string;
  uiSchema: FormSectionSchema;
};

export type AppFormMetadata = {
  sections: AppFormSectionMeta[];
};

export type Product = {
  id: number;
  nameKo: string;
  nameEn: string;
  tagline: string | null;
  image: string;
  productTags: Array<{
    tag: {
      name: string;
    };
  }>;
};

export type SelectedWorkspace = {
  elementId: string;
  elementText: string;
};

export type SelectedMembers = {
  profileImgUrl: string | undefined;
  name: string;
  email: string;
  joinDate: string;
};

export type PaymentInfo = {
  cardNumber: string;
  billingEmail: string;
  nextPaymentDate: string;
  nextPaymentAmount: string;
  currentPaymentAmount: string;
  subscriptionPlanName: string;
  billingCycleType: string;
};

export type PaymentHistory = {
  date: string;
  amount: string;
  invoiceUrl: string;
};
