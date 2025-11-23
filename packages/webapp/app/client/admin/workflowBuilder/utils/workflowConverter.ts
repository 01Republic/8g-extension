import type { Node } from "@xyflow/react";
import type { Workflow, WorkflowStep } from "scordi-extension";
import { AllBlockSchemas } from "scordi-extension";
import type { WorkflowEdge } from "~/models/workflow/types";
import { getLayoutedElements } from "./autoLayout";
import { getConditionLabel } from "./conditionUtils";

interface ConvertedWorkflow {
  nodes: Node[];
  edges: WorkflowEdge[];
}

/**
 * Workflow JSON을 React Flow의 노드/엣지로 변환
 */
export function convertWorkflowToNodesAndEdges(
  workflow: Workflow,
): ConvertedWorkflow {
  const nodes: Node[] = [];
  const edges: WorkflowEdge[] = [];

  // Steps를 노드로 변환
  workflow.steps.forEach((step: WorkflowStep, index: number) => {
    const blockName = step.block?.name || "generic-block";
    const schema =
      AllBlockSchemas[blockName as keyof typeof AllBlockSchemas] || null;

    const node: Node = {
      id: step.id,
      type: blockName,
      position: { x: 200 * index, y: 100 * index }, // 임시 위치 (나중에 레이아웃으로 재배치)
      data: {
        title: step.title || blockName || step.id,
        block: step.block,
        schema, // ✅ AllBlockSchemas에서 스키마 매칭!
        repeat: step.repeat, // ✅ repeat 데이터 역변환
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

  // 자동 레이아웃 적용
  const layouted = getLayoutedElements(nodes, edges, "TB");

  return {
    nodes: layouted.nodes,
    edges: layouted.edges,
  };
}
