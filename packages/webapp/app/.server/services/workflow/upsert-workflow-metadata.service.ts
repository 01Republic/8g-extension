import { initializeDatabase } from "~/.server/db/config";
import { IntegrationAppWorkflowMetadata, type WorkflowType } from "~/.server/db/entities/IntegrationAppWorkflowMetadata";
import type { FormWorkflow } from "~/models/workflow/types";

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
  await initializeDatabase();

  if (workflowId) {
    // Update existing workflow
    await IntegrationAppWorkflowMetadata.update(workflowId, {
      productId,
      description,
      meta,
      type,
    });

    const updated = await IntegrationAppWorkflowMetadata.findOne({
      where: { id: workflowId }
    });
    return updated;
  } else {
    // Create new workflow
    const workflow = IntegrationAppWorkflowMetadata.create({
      productId,
      description,
      meta,
      type,
    });

    const saved = await IntegrationAppWorkflowMetadata.save(workflow);
    return saved;
  }
}
