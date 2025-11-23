import type { WhenCondition } from "~/models/workflow/types";
import type { EdgeFormState } from "../edgeDataConverter";
import type { SubCondition } from "../types";
import { BaseConditionStrategy } from "./types";
import {
  extractNodeIdFromPath,
  extractPathFromJsonPath,
  buildJsonPath,
} from "../../../utils/conditionUtils";

/**
 * Exists 조건 전략
 */
export class ExistsStrategy extends BaseConditionStrategy {
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void {
    if (!when.exists) return;

    formState.existsData = {
      nodeId: extractNodeIdFromPath(when.exists),
      path: extractPathFromJsonPath(when.exists) || "result",
    };
  }

  buildWhen(formState: EdgeFormState): WhenCondition {
    const { nodeId, path } = formState.existsData;
    const existsPath = buildJsonPath(nodeId, path);
    return {
      exists: existsPath,
    };
  }

  getLabel(formState: EdgeFormState): string {
    return "exists";
  }

  buildFromSubCondition(sub: SubCondition): WhenCondition {
    const fullPath = buildJsonPath(sub.nodeId, sub.path);
    return {
      exists: fullPath,
    };
  }

  parseToSubCondition(when: WhenCondition, id: string): SubCondition | null {
    if (!when.exists) return null;

    const nodeId = extractNodeIdFromPath(when.exists);
    const path = extractPathFromJsonPath(when.exists) || "result";
    return {
      id,
      type: "exists",
      nodeId,
      path,
    };
  }
}
