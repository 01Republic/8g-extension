import { initializeDatabase } from "~/.server/db";
import { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";

export async function deleteWorkflows(workflowId: number) {
  await initializeDatabase();

  await IntegrationAppWorkflowMetadata.delete(workflowId);
}
