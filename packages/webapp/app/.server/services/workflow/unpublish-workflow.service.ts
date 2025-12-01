import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

export async function unpublishWorkflow(workflowId: number) {
  await initializeDatabase();

  await IntegrationAppWorkflowMetadata.update(
    { id: workflowId },
    { publishedAt: null }
  );

  return await IntegrationAppWorkflowMetadata.findOne({
    where: { id: workflowId },
  });
}
