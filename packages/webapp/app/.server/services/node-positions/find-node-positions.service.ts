import { initializeDatabase } from "~/.server/db/config";
import { WorkflowNodePositions } from "~/.server/db/entities/WorkflowNodePositions";

export async function findNodePositions(workflowId: number) {
  await initializeDatabase();
  return await WorkflowNodePositions.findOne({
    where: { workflowId },
  });
}
