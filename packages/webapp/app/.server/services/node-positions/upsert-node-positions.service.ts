import { initializeDatabase } from "~/.server/db/config";
import {
  WorkflowNodePositions,
  type NodePositionsMap,
  type NodeGroupsMap,
  type NodeAliasesMap,
} from "~/.server/db/entities/WorkflowNodePositions";

interface UpsertPayload {
  workflowId: number;
  positions: NodePositionsMap;
  groups?: NodeGroupsMap | null;
  aliases?: NodeAliasesMap | null;
}

export async function upsertNodePositions({
  workflowId,
  positions,
  groups,
  aliases,
}: UpsertPayload) {
  await initializeDatabase();

  const existing = await WorkflowNodePositions.findOne({
    where: { workflowId },
  });

  if (existing) {
    await WorkflowNodePositions.update(existing.id, {
      positions,
      groups: groups ?? null,
      aliases: aliases ?? null,
    });
    return await WorkflowNodePositions.findOne({ where: { workflowId } });
  } else {
    const entity = WorkflowNodePositions.create({
      workflowId,
      positions,
      groups: groups ?? null,
      aliases: aliases ?? null,
    });
    return await WorkflowNodePositions.save(entity);
  }
}
