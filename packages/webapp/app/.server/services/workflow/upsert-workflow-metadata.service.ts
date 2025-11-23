import type { WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import type { FormWorkflow } from "~/models/workflow/types";

const WORKFLOW_API_BASE_URL =
  process.env.WORKFLOW_API_BASE_URL || "http://localhost:8000";

interface UpsertWorkflowMetadataPayload {
  workflowId?: number;
  productId: number;
  description: string;
  meta: FormWorkflow;
  type?: WorkflowType;
}

export async function upsertWorkflowMetadata({
  workflowId,
  productId,
  description,
  meta,
  type = "WORKFLOW",
}: UpsertWorkflowMetadataPayload) {
  const requestBody = {
    workflowId,
    productId,
    description,
    meta,
    type,
  };

  const response = await fetch(`${WORKFLOW_API_BASE_URL}/8g/workflows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upsert workflow: ${response.statusText} - ${errorText}`,
    );
  }

  // 201 Created는 body가 없을 수 있음
  const text = await response.text();
  if (text) {
    return JSON.parse(text);
  }
  return null;
}
