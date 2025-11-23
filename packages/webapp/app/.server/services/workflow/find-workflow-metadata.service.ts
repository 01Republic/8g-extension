const WORKFLOW_API_BASE_URL =
  process.env.WORKFLOW_API_BASE_URL || "http://localhost:8000";

interface WorkflowMetadataResponse {
  id: number;
  description: string;
  meta: any;
  type: string;
  productId: number;
  createdAt: string;
  updatedAt: string;
}

export async function findWorkflowMetadata(workflowId: number) {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/8g/workflows/${workflowId}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch workflow: ${response.statusText} - ${errorText}`,
    );
  }

  return response.json() as Promise<WorkflowMetadataResponse>;
}

export async function findWorkflowMetadataByProductId(productId: number) {
  // API에 productId 필터가 없으므로 전체 조회 후 클라이언트에서 필터링
  const response = await fetch(`${WORKFLOW_API_BASE_URL}/8g/workflows`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch workflows: ${response.statusText} - ${errorText}`,
    );
  }

  const workflows = (await response.json()) as WorkflowMetadataResponse[];

  // productId로 필터링하여 가장 최근 것 반환
  const filtered = workflows.filter((w) => w.productId === productId);
  if (filtered.length > 0) {
    return filtered.sort((a, b) => b.id - a.id)[0];
  }
  return null;
}
