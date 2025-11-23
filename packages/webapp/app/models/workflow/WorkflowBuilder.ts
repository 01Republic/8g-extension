import type { Workflow, WorkflowStep, Block } from "scordi-extension";
import type { WorkflowEdge } from "./types";
import type { FormWorkflow } from "../integration/types";

export const buildWorkflowJson = (
  nodes: any[],
  edges: WorkflowEdge[],
  targetUrl: string,
): FormWorkflow => {
  const outgoingEdges = new Map<string, WorkflowEdge[]>();
  const incomingCount = new Map<string, number>();

  nodes.forEach((n) => incomingCount.set(n.id, 0));

  // Edge를 source별로 그룹핑
  edges.forEach((e) => {
    const src = e.source;
    const tgt = e.target;
    if (!outgoingEdges.has(src)) outgoingEdges.set(src, []);
    outgoingEdges.get(src)!.push(e);
    incomingCount.set(tgt, (incomingCount.get(tgt) ?? 0) + 1);
  });

  const startNode =
    nodes.find((n) => (incomingCount.get(n.id) ?? 0) === 0) ?? nodes[0];

  const steps: WorkflowStep[] = nodes.map((n) => {
    const edges = outgoingEdges.get(n.id) ?? [];
    const block = (n.data as any).block as Block;
    const repeat = (n.data as any).repeat; // ✅ repeat 데이터 추출

    const step: WorkflowStep = {
      id: n.id,
      block: {
        ...block,
        option: block.option ?? {},
      },
    };

    // ✅ repeat 데이터가 있으면 추가
    if (repeat) {
      step.repeat = repeat;
    }

    // switch 조건이 있는 edge들
    const conditionalEdges = edges.filter(
      (e) => e.data?.when && !e.data?.isDefault,
    );
    // 기본 edge (조건 없음)
    const defaultEdge = edges.find((e) => e.data?.isDefault || !e.data?.when);

    // switch 배열 생성
    if (conditionalEdges.length > 0) {
      step.switch = conditionalEdges.map((e) => ({
        when: e.data!.when!,
        next: e.target,
      }));
    }

    // 기본 next (모든 조건이 false일 때)
    if (defaultEdge) {
      step.next = defaultEdge.target;
    } else if (edges.length === 1 && !conditionalEdges.length) {
      // 조건 없는 단일 edge인 경우
      step.next = edges[0].target;
    }

    return step;
  });

  return {
    version: "1.0",
    start: startNode?.id ?? (nodes[0]?.id || ""),
    steps,
    targetUrl,
  } as FormWorkflow;
};
