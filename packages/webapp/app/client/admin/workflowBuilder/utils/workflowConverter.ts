import type { Node } from "@xyflow/react";
import type { Workflow, WorkflowStep } from "scordi-extension";
import { AllBlockSchemas } from "scordi-extension";
import type { WorkflowEdge } from "~/models/workflow/types";
import { getLayoutedElements } from "./autoLayout";
import { getConditionLabel } from "./conditionUtils";
import type { NodeGroupsMap, NodeAliasesMap } from "~/.server/db/entities/WorkflowNodePositions";

export type NodePositionsMap = Record<string, { x: number; y: number }>;

interface ConvertedWorkflow {
  nodes: Node[];
  edges: WorkflowEdge[];
}

/**
 * Workflow JSON을 React Flow의 노드/엣지로 변환
 *
 * @param workflow - 워크플로우 JSON
 * @param nodePositions - 저장된 노드 위치 정보 (없으면 dagre 자동 레이아웃 적용)
 * @param nodeGroups - 저장된 그룹 정보 (있으면 그룹 노드로 변환)
 * @param nodeAliases - 저장된 별칭 정보 (있으면 노드 data에 alias 포함)
 */
export function convertWorkflowToNodesAndEdges(
  workflow: Workflow,
  nodePositions?: NodePositionsMap | null,
  nodeGroups?: NodeGroupsMap | null,
  nodeAliases?: NodeAliasesMap | null,
): ConvertedWorkflow {
  const nodes: Node[] = [];
  const edges: WorkflowEdge[] = [];

  // 저장된 위치가 있는지 확인
  const hasPositions = nodePositions && Object.keys(nodePositions).length > 0;

  // Steps를 노드로 변환
  workflow.steps.forEach((step: WorkflowStep, index: number) => {
    const blockName = step.block?.name || "generic-block";
    const schema =
      AllBlockSchemas[blockName as keyof typeof AllBlockSchemas] || null;

    // 저장된 위치가 있으면 사용, 없으면 임시 위치 (나중에 레이아웃으로 재배치)
    const position =
      hasPositions && nodePositions[step.id]
        ? nodePositions[step.id]
        : { x: 200 * index, y: 100 * index };

    const node: Node = {
      id: step.id,
      type: blockName,
      position,
      data: {
        title: step.title || blockName || step.id,
        block: step.block,
        schema, // ✅ AllBlockSchemas에서 스키마 매칭!
        repeat: step.repeat, // ✅ repeat 데이터 역변환
        alias: nodeAliases?.[step.id], // ✅ 저장된 별칭 적용
      },
    };
    nodes.push(node);
  });

  // Steps의 연결 관계를 엣지로 변환
  workflow.steps.forEach((step: WorkflowStep) => {
    // switch 조건들
    if (step.switch && Array.isArray(step.switch)) {
      step.switch.forEach((switchCase, index) => {
        const edge: WorkflowEdge = {
          id: `${step.id}-${switchCase.next}-switch-${index}`,
          source: step.id,
          target: switchCase.next,
          type: "conditional",
          data: {
            when: switchCase.when,
            isDefault: false,
            conditionLabel: getConditionLabel(switchCase.when),
          },
        };
        edges.push(edge);
      });
    }

    // 기본 next (조건 없음)
    if (step.next) {
      const edge: WorkflowEdge = {
        id: `${step.id}-${step.next}-next`,
        source: step.id,
        target: step.next,
        type: "conditional",
        data: {
          isDefault: true,
          conditionLabel: "default",
        },
      };
      edges.push(edge);
    }

    // onSuccess
    if (step.onSuccess) {
      const edge: WorkflowEdge = {
        id: `${step.id}-${step.onSuccess}-success`,
        source: step.id,
        target: step.onSuccess,
        type: "conditional",
        data: {
          isDefault: false,
          conditionLabel: "onSuccess",
        },
      };
      edges.push(edge);
    }

    // onFailure
    if (step.onFailure) {
      const edge: WorkflowEdge = {
        id: `${step.id}-${step.onFailure}-failure`,
        source: step.id,
        target: step.onFailure,
        type: "conditional",
        data: {
          isDefault: false,
          conditionLabel: "onFailure",
        },
      };
      edges.push(edge);
    }
  });

  // 저장된 위치가 없을 때만 자동 레이아웃 적용
  if (!hasPositions) {
    const layouted = getLayoutedElements(nodes, edges, "TB");
    return {
      nodes: layouted.nodes,
      edges: layouted.edges,
    };
  }

  // 그룹 노드 추가 (저장된 그룹이 있을 경우)
  if (nodeGroups && Object.keys(nodeGroups).length > 0) {
    const groupNodes: Node[] = [];
    Object.entries(nodeGroups).forEach(([groupId, group]) => {
      const groupNode: Node = {
        id: groupId,
        type: "group",
        position: group.position,
        style: { width: group.width, height: group.height },
        data: { label: group.label, color: group.color, nodeIds: group.nodeIds },
      };
      groupNodes.push(groupNode);
    });

    // 그룹 노드를 맨 앞에 추가 (z-index가 가장 낮게)
    return {
      nodes: [...groupNodes, ...nodes],
      edges,
    };
  }

  // 저장된 위치가 있으면 그대로 반환
  return {
    nodes,
    edges,
  };
}
