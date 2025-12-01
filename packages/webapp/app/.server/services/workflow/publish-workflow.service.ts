import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import { findPublishedWorkflow } from "./find-published-workflow.service";

export async function publishWorkflow(workflowId: number) {
  await initializeDatabase();

  // Get workflow to publish
  const workflow = await IntegrationAppWorkflowMetadata.findOne({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Use transaction to ensure atomicity
  const dataSource = IntegrationAppWorkflowMetadata.getRepository().manager.connection;

  await dataSource.transaction(async (transactionalEntityManager) => {
    // Find currently published workflow with same type+productId
    const currentlyPublished = await findPublishedWorkflow(
      workflow.type,
      workflow.productId
    );

    // Unpublish the old one if exists
    if (currentlyPublished && currentlyPublished.id !== workflowId) {
      await transactionalEntityManager.update(
        IntegrationAppWorkflowMetadata,
        { id: currentlyPublished.id },
        { publishedAt: null }
      );
    }

    // Publish the new one
    await transactionalEntityManager.update(
      IntegrationAppWorkflowMetadata,
      { id: workflowId },
      { publishedAt: new Date() }
    );
  });

  // Return updated workflow
  return await IntegrationAppWorkflowMetadata.findOne({
    where: { id: workflowId },
  });
}
