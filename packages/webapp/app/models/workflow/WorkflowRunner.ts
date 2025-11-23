import { EightGClient } from "scordi-extension";
import type { FormWorkflow } from "~/models/integration/types";

export type RunWorkflowParams =
  | {
      evaluatedUrl: string;
      workflow: FormWorkflow;
      closeTabAfterCollection?: boolean;
      activateTab?: boolean;
      variables?: Record<string, any>;
      type?: "WORKFLOW";
    }
  | {
      evaluatedUrl: string;
      workflow: FormWorkflow;
      closeTabAfterCollection?: boolean;
      activateTab?: boolean;
      variables?: Record<string, any>;
      type: "WORKSPACE";
    }
  | {
      evaluatedUrl: string;
      workflow: FormWorkflow;
      closeTabAfterCollection?: boolean;
      activateTab?: boolean;
      variables?: Record<string, any>;
      type: "WORKSPACE_DETAIL" | "MEMBERS" | "BILLING" | "BILLING_HISTORIES";
      workspaceKey: string; // 필수!
      slug: string;
    }
  | {
      evaluatedUrl: string;
      workflow: FormWorkflow;
      closeTabAfterCollection?: boolean;
      activateTab?: boolean;
      variables?: Record<string, any>;
      type: "ADD_MEMBERS";
      workspaceKey: string; // 필수!
      slug: string;
      emails: string[]; // 필수!
    }
  | {
      evaluatedUrl: string;
      workflow: FormWorkflow;
      closeTabAfterCollection?: boolean;
      activateTab?: boolean;
      variables?: Record<string, any>;
      type: "DELETE_MEMBERS";
      workspaceKey: string; // 필수!
      slug: string;
      emails: string[]; // 필수!
    };

export interface RunWorkflowResult {
  result: any;
}

export async function runWorkflow(
  params: RunWorkflowParams,
): Promise<RunWorkflowResult> {
  const {
    evaluatedUrl,
    workflow,
    closeTabAfterCollection,
    activateTab,
    variables,
  } = params;
  const type = params.type ?? "WORKFLOW"; // 기본값은 일반 WORKFLOW
  const workspaceKey =
    "workspaceKey" in params ? params.workspaceKey : undefined;
  const slug = "slug" in params ? params.slug : undefined;
  const emails = "emails" in params ? params.emails : undefined;
  const client = new EightGClient();

  // vars 필드에 변수 병합 (workflow.vars + 주입된 variables)
  const finalVars = {
    ...workflow.vars,
    ...variables,
  };

  const requestParams = {
    targetUrl: workflow.targetUrl ?? evaluatedUrl,
    workflow: {
      version: "1.0" as const,
      start: workflow.start,
      steps: workflow.steps,
      vars: Object.keys(finalVars).length > 0 ? finalVars : undefined,
    },
    closeTabAfterCollection: closeTabAfterCollection ?? true,
    activateTab: activateTab ?? true,
  };

  // 타입에 따라 다른 메서드 호출
  let result: any;
  switch (type) {
    case "WORKSPACE":
      result = await client.getWorkspaces(requestParams);
      break;
    case "WORKSPACE_DETAIL":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for WORKSPACE_DETAIL type");
      if (!slug) throw new Error("slug is required for WORKSPACE_DETAIL type");
      result = await client.getWorkspaceDetail(
        workspaceKey,
        slug,
        requestParams,
      );
      break;
    case "MEMBERS":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for MEMBERS type");
      if (!slug) throw new Error("slug is required for MEMBERS type");
      result = await client.getWorkspaceMembers(
        workspaceKey,
        slug,
        requestParams,
      );
      break;
    case "ADD_MEMBERS":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for ADD_MEMBERS type");
      if (!slug) throw new Error("slug is required for ADD_MEMBERS type");
      if (!emails || emails.length === 0)
        throw new Error("emails is required for ADD_MEMBERS type");
      result = await client.addMembers(
        workspaceKey,
        slug,
        emails,
        requestParams,
      );
      break;
    case "DELETE_MEMBERS":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for DELETE_MEMBERS type");
      if (!slug) throw new Error("slug is required for DELETE_MEMBERS type");
      if (!emails || emails.length === 0)
        throw new Error("emails is required for DELETE_MEMBERS type");
      result = await client.deleteMembers(
        workspaceKey,
        slug,
        emails,
        requestParams,
      );
      break;
    case "BILLING":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for BILLING type");
      if (!slug) throw new Error("slug is required for BILLING type");
      result = await client.getWorkspaceBilling(
        workspaceKey,
        slug,
        requestParams,
      );
      break;
    case "BILLING_HISTORIES":
      if (!workspaceKey)
        throw new Error("workspaceKey is required for BILLING_HISTORIES type");
      if (!slug) throw new Error("slug is required for BILLING_HISTORIES type");
      result = await client.getWorkspaceBillingHistories(
        workspaceKey,
        slug,
        requestParams,
      );
      break;
    case "WORKFLOW":
    default:
      result = await client.collectWorkflow(requestParams);
      break;
  }

  return { result };
}
