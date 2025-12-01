import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata, type WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import { IsNull, Not } from "typeorm";

export async function findPublishedWorkflow(
  type: WorkflowType,
  productId: number
): Promise<IntegrationAppWorkflowMetadata | null> {
  await initializeDatabase();

  const published = await IntegrationAppWorkflowMetadata.findOne({
    where: {
      type,
      productId,
      publishedAt: Not(IsNull()),
    },
  });

  return published;
}
