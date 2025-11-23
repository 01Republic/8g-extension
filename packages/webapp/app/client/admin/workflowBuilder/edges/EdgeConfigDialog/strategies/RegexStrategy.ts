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
 * Regex 조건 전략
 */
export class RegexStrategy extends BaseConditionStrategy {
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void {
    if (!when.regex) return;

    formState.regexData = {
      nodeId: extractNodeIdFromPath(when.regex.value || ""),
      path: extractPathFromJsonPath(when.regex.value || "") || "result.data",
      pattern: when.regex.pattern || "",
    };
  }

  buildWhen(formState: EdgeFormState): WhenCondition {
    const { nodeId, path, pattern } = formState.regexData;
    const regexPath = buildJsonPath(nodeId, path);
    return {
      regex: { value: regexPath, pattern },
    };
  }

  getLabel(formState: EdgeFormState): string {
    return `~= ${formState.regexData.pattern}`;
  }

  buildFromSubCondition(sub: SubCondition): WhenCondition {
    const fullPath = buildJsonPath(sub.nodeId, sub.path);
    return {
      regex: { value: fullPath, pattern: sub.value || "" },
    };
  }

  parseToSubCondition(when: WhenCondition, id: string): SubCondition | null {
    if (!when.regex) return null;

    const nodeId = extractNodeIdFromPath(when.regex.value || "");
    const path =
      extractPathFromJsonPath(when.regex.value || "") || "result.data";
    return {
      id,
      type: "regex",
      nodeId,
      path,
      value: when.regex.pattern || "",
    };
  }
}
