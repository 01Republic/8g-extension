import type { WhenCondition } from "~/models/workflow/types";

/**
 * JSONPath에서 노드 ID 추출
 * 예: "$.steps.nodeId.result.data" → "nodeId"
 * 예: "steps.nodeId.result.data" → "nodeId"
 */
export function extractNodeIdFromPath(path: string): string {
  // 기존 형식: $.steps.nodeId.path
  // 새로운 형식: steps.nodeId.path
  const match = path.match(/(?:\$\.)?steps\.([^.]+)/);
  return match ? match[1] : "";
}

/**
 * JSONPath에서 경로 부분 추출
 * 예: "$.steps.nodeId.result.data" → "result.data"
 * 예: "steps.nodeId.result.data" → "result.data"
 */
export function extractPathFromJsonPath(jsonPath: string): string {
  // 기존 형식: $.steps.nodeId.path
  // 새로운 형식: steps.nodeId.path
  const match = jsonPath.match(/(?:\$\.)?steps\.[^.]+\.(.+)/);
  return match ? match[1] : "";
}

/**
 * 노드 ID와 경로를 JSONPath로 결합
 * 예: ("nodeId", "result.data") → "steps.nodeId.result.data"
 */
export function buildJsonPath(nodeId: string, path: string): string {
  return `steps.${nodeId}.${path}`;
}

/**
 * 조건을 라벨로 변환
 * - workflowConverter와 edgeDataConverter에서 공통으로 사용
 */
export function getConditionLabel(when?: WhenCondition): string {
  if (!when) return "condition";

  if (when.equals) {
    return `== ${when.equals.right}`;
  }
  if (when.contains) {
    return `contains ${when.contains.search}`;
  }
  if (when.exists) {
    return "exists";
  }
  if (when.regex) {
    return `~= ${when.regex.pattern}`;
  }
  if (when.expr) {
    return when.expr.length > 15
      ? when.expr.substring(0, 15) + "..."
      : when.expr;
  }
  if (when.and) {
    return `AND (${when.and.length})`;
  }
  if (when.or) {
    return `OR (${when.or.length})`;
  }

  return "condition";
}
