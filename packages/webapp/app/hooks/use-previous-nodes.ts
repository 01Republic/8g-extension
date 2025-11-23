import { useReactFlow } from "@xyflow/react";
import { blockLabels } from "../client/admin/workflowBuilder/nodes/index";

/**
 * 현재 노드보다 이전에 있는 모든 노드들을 BFS로 찾는 훅
 */
export function usePreviousNodes(currentNodeId: string) {
  const { getNodes, getEdges } = useReactFlow();

  const getPreviousNodes = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    // BFS로 현재 노드 이전의 모든 노드 찾기
    const visited = new Set<string>();
    const queue: string[] = [];

    // 현재 노드로 들어오는 edge들의 source를 큐에 추가
    const incomingEdges = allEdges.filter(
      (edge) => edge.target === currentNodeId,
    );
    incomingEdges.forEach((edge) => {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        queue.push(edge.source);
      }
    });

    // BFS로 모든 이전 노드 탐색
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const prevEdges = allEdges.filter((edge) => edge.target === nodeId);

      prevEdges.forEach((edge) => {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push(edge.source);
        }
      });
    }

    // visited에 있는 노드들 반환
    return allNodes.filter((node) => visited.has(node.id));
  };

  const previousNodes = getPreviousNodes();

  // Repeat 컨텍스트 변수 정의
  const repeatContextVariables = [
    { id: "forEach.item", label: "forEach.item - 현재 배열 항목" },
    { id: "forEach.index", label: "forEach.index - 현재 인덱스" },
    { id: "forEach.total", label: "forEach.total - 전체 배열 길이" },
    { id: "loop.index", label: "loop.index - 현재 반복 인덱스" },
    { id: "loop.count", label: "loop.count - 전체 반복 횟수" },
  ];

  // 노드 ID에서 표시 이름 가져오기
  const getNodeDisplayName = (node: any) => {
    const blockName = (node.data as any)?.block?.name || "";
    const displayName =
      blockName && blockLabels[blockName]
        ? blockLabels[blockName].title
        : blockName || node.id;
    return `${node.id} - ${displayName}`;
  };

  // 값에서 노드 ID 추출 (${$.steps.{nodeId}.result} 형태)
  const extractNodeId = (value: string) => {
    if (!value || typeof value !== "string") return "";
    const match = value.match(/\$\{?\$?\.?steps\.([^.}]+)\.result/);
    return match ? match[1] : "";
  };

  // 노드 ID를 템플릿 문자열로 변환 (블록 필드 값용)
  const createNodeReference = (nodeId: string) => {
    return `\${$.steps.${nodeId}.result.data}`;
  };

  // Repeat 컨텍스트 변수를 템플릿 문자열로 변환 (블록 필드 값용)
  const createRepeatReference = (contextPath: string) => {
    return `\${${contextPath}}`;
  };

  // 순수 경로 생성 (repeat.forEach 등 설정 필드용)
  const createPathReference = (nodeId: string) => {
    return `steps.${nodeId}.result.data`;
  };

  return {
    previousNodes,
    getNodeDisplayName,
    extractNodeId,
    createNodeReference,
    repeatContextVariables,
    createRepeatReference,
    createPathReference,
  };
}
