import { initializeDatabase } from "~/.server/db/config";
import {
  WorkflowNodePositions,
  type NodePositionsMap,
} from "~/.server/db/entities/WorkflowNodePositions";

interface UpsertPayload {
  workflowId: number;
  positions: NodePositionsMap;
}

export async function upsertNodePositions({
  workflowId,
  positions,
}: UpsertPayload) {
  await initializeDatabase();

  const existing = await WorkflowNodePositions.findOne({
    where: { workflowId },
  });

  if (existing) {
    await WorkflowNodePositions.update(existing.id, { positions });
    return await WorkflowNodePositions.findOne({ where: { workflowId } });
  } else {
    const entity = WorkflowNodePositions.create({ workflowId, positions });
    return await WorkflowNodePositions.save(entity);
  }
}
