import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

// 기본 노드 크기 (measured가 없을 때 사용)
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 80;

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" | "BT" | "RL" = "TB",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80, // 노드 간 가로 간격 (늘림)
    ranksep: 80, // 레벨 간 세로 간격
  });

  // 그룹 노드는 정렬에서 제외
  const workflowNodes = nodes.filter((node) => node.type !== "group");
  const groupNodes = nodes.filter((node) => node.type === "group");

  // 각 노드의 실제 크기를 사용 (measured 또는 기본값)
  const nodeSizes: Record<string, { width: number; height: number }> = {};
  workflowNodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    nodeSizes[node.id] = { width, height };
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedWorkflowNodes = workflowNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const { width, height } = nodeSizes[node.id];
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  // 그룹 노드의 위치와 크기를 하위 노드들에 맞게 업데이트
  const padding = 40;
  const groupGap = 30; // 그룹 간 간격

  // 1단계: 각 그룹의 기본 위치와 크기 계산
  const groupBounds: Array<{
    node: Node;
    x: number;
    y: number;
    width: number;
    height: number;
    hasChildren: boolean;
  }> = [];

  groupNodes.forEach((groupNode) => {
    const nodeIds: string[] = (groupNode.data as any)?.nodeIds || [];
    const childNodes = layoutedWorkflowNodes.filter((n) => nodeIds.includes(n.id));

    if (childNodes.length === 0) {
      // 하위 노드가 없으면 원래 위치/크기 유지
      const width = (groupNode.style?.width as number) || 300;
      const height = (groupNode.style?.height as number) || 200;
      groupBounds.push({
        node: groupNode,
        x: groupNode.position.x,
        y: groupNode.position.y,
        width,
        height,
        hasChildren: false,
      });
      return;
    }

    // 하위 노드들의 바운딩 박스 계산
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    childNodes.forEach((node) => {
      const { width: nWidth, height: nHeight } = nodeSizes[node.id] || {
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      };
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nWidth);
      maxY = Math.max(maxY, node.position.y + nHeight);
    });

    const newWidth = maxX - minX + padding * 2;
    const newHeight = maxY - minY + padding * 2;
    const newX = minX - padding;
    const newY = minY - padding;

    groupBounds.push({
      node: groupNode,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      hasChildren: true,
    });
  });

  // 2단계: 그룹 간 겹침 해소 (하위 노드가 없는 그룹만 이동)
  const resolveGroupOverlaps = () => {
    let hasOverlap = true;
    let iterations = 0;
    const maxIterations = 50;

    while (hasOverlap && iterations < maxIterations) {
      hasOverlap = false;
      iterations++;

      for (let i = 0; i < groupBounds.length; i++) {
        for (let j = i + 1; j < groupBounds.length; j++) {
          const g1 = groupBounds[i];
          const g2 = groupBounds[j];

          // 겹침 체크
          const overlapX =
            g1.x < g2.x + g2.width + groupGap &&
            g1.x + g1.width + groupGap > g2.x;
          const overlapY =
            g1.y < g2.y + g2.height + groupGap &&
            g1.y + g1.height + groupGap > g2.y;

          if (overlapX && overlapY) {
            hasOverlap = true;

            // 하위 노드가 없는 그룹을 이동 (둘 다 없거나 둘 다 있으면 j를 이동)
            const moveTarget = !g1.hasChildren && g2.hasChildren ? g1 : g2;

            // 가장 적게 이동하는 방향 계산
            const moveRight = g1.x + g1.width + groupGap - g2.x;
            const moveLeft = g2.x + g2.width + groupGap - g1.x;
            const moveDown = g1.y + g1.height + groupGap - g2.y;
            const moveUp = g2.y + g2.height + groupGap - g1.y;

            const minMove = Math.min(moveRight, moveLeft, moveDown, moveUp);

            if (moveTarget === g2) {
              if (minMove === moveRight) g2.x = g1.x + g1.width + groupGap;
              else if (minMove === moveLeft) g2.x = g1.x - g2.width - groupGap;
              else if (minMove === moveDown) g2.y = g1.y + g1.height + groupGap;
              else g2.y = g1.y - g2.height - groupGap;
            } else {
              if (minMove === moveRight) g1.x = g2.x + g2.width + groupGap;
              else if (minMove === moveLeft) g1.x = g2.x - g1.width - groupGap;
              else if (minMove === moveDown) g1.y = g2.y + g2.height + groupGap;
              else g1.y = g2.y - g1.height - groupGap;
            }
          }
        }
      }
    }
  };

  resolveGroupOverlaps();

  // 3단계: 그룹 이동에 따라 하위 노드들도 이동
  // 원래 그룹 위치와 새 위치의 차이만큼 하위 노드들을 이동
  const nodeOffsets: Record<string, { dx: number; dy: number }> = {};

  groupBounds.forEach((gb) => {
    const nodeIds: string[] = (gb.node.data as any)?.nodeIds || [];
    if (nodeIds.length === 0 || !gb.hasChildren) return;

    // 원래 그룹 위치 계산 (하위 노드들 기준)
    const childNodes = layoutedWorkflowNodes.filter((n) => nodeIds.includes(n.id));
    let minX = Infinity, minY = Infinity;
    childNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
    });
    const originalX = minX - padding;
    const originalY = minY - padding;

    // 이동량 계산
    const dx = gb.x - originalX;
    const dy = gb.y - originalY;

    if (dx !== 0 || dy !== 0) {
      nodeIds.forEach((nodeId) => {
        nodeOffsets[nodeId] = { dx, dy };
      });
    }
  });

  // 하위 노드들 위치 업데이트
  const finalWorkflowNodes = layoutedWorkflowNodes.map((node) => {
    const offset = nodeOffsets[node.id];
    if (offset) {
      return {
        ...node,
        position: {
          x: node.position.x + offset.dx,
          y: node.position.y + offset.dy,
        },
      };
    }
    return node;
  });

  // 4단계: 최종 그룹 노드 생성
  const layoutedGroupNodes = groupBounds.map((gb) => ({
    ...gb.node,
    position: { x: gb.x, y: gb.y },
    style: { ...gb.node.style, width: gb.width, height: gb.height },
  }));

  // 그룹 노드를 맨 앞에 배치 (z-index 낮게)
  return { nodes: [...layoutedGroupNodes, ...finalWorkflowNodes], edges };
};
