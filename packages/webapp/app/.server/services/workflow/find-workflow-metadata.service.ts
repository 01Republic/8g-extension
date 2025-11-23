import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

export async function findWorkflowMetadata(workflowId: number) {
  await initializeDatabase();

  const workflow = await IntegrationAppWorkflowMetadata.findOne({
    where: { id: workflowId }
  });

  return workflow;
}

export async function findWorkflowMetadataByProductId(productId: number) {
  await initializeDatabase();

  const workflow = await IntegrationAppWorkflowMetadata.findOne({
    where: { productId },
    order: { id: "DESC" } // 가장 최근 것 반환
  });

  return workflow;
}
