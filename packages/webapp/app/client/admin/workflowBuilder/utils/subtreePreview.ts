import type { Edge, Node } from "@xyflow/react";

export type SubtreePreviewInfo = {
  nodeIds: string[];
  roles: Record<string, "start" | "middle" | "end-neighbor">;
};

export function collectSubtreeNodes(
  _nodes: Node[],
  edges: Edge[],
  startId: string,
  subtreeEnd: string,
): SubtreePreviewInfo {
  const resultIds: string[] = [startId];
  const roles: SubtreePreviewInfo["roles"] = {};
  const visited = new Set<string>();
  const queue: string[] = [];

  const startEdges = edges.filter((edge) => edge.source === startId);
  startEdges.forEach((edge) => {
    if (edge.target === subtreeEnd) {
      roles[startId] = "end-neighbor";
      return;
    }
    visited.add(edge.target);
    queue.push(edge.target);
    resultIds.push(edge.target);
    roles[edge.target] = "middle";
  });

  roles[startId] = "start";

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    edges
      .filter((edge) => edge.source === nodeId)
      .forEach((edge) => {
        if (edge.target === subtreeEnd || visited.has(edge.target)) {
          if (edge.target === subtreeEnd) {
            roles[nodeId] = "end-neighbor";
          }
          return;
        }
        visited.add(edge.target);
        queue.push(edge.target);
        resultIds.push(edge.target);
        roles[edge.target] = "middle";
      });
  }

  return {
    nodeIds: Array.from(new Set(resultIds)),
    roles,
  };
}


