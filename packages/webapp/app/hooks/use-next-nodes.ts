import { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { blockLabels } from "../client/admin/workflowBuilder/nodes";
import type { Node } from "@xyflow/react";

/**
 * 현재 노드 이후에 도달 가능한 모든 노드 리스트를 반환하는 훅
 */
export function useNextNodes(currentNodeId: string) {
  const { getNodes, getEdges } = useReactFlow();
  const nodes = getNodes();
  const edges = getEdges();

  const nextNodes = useMemo(() => {
    const visited = new Set<string>();
    const queue: string[] = [];

    // 현재 노드에서 나가는 엣지의 target을 큐에 추가
    const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    outgoingEdges.forEach((edge) => {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    });

    // BFS로 모든 downstream 노드 탐색
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      edges.filter((edge) => edge.source === nodeId).forEach((edge) => {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    return nodes.filter((node) => visited.has(node.id));
  }, [nodes, edges, currentNodeId]);

  const getNodeDisplayName = (node: Node) => {
    const blockName = (node.data as any)?.block?.name || "";
    const displayName =
      blockName && blockLabels[blockName]
        ? blockLabels[blockName].title
        : blockName || node.id;
    return `${node.id} - ${displayName}`;
  };

  return {
    nextNodes,
    getNodeDisplayName,
  };
}


