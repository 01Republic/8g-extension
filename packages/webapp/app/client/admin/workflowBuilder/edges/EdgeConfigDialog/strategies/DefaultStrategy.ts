import type { WhenCondition } from "~/models/workflow/types";
import type { EdgeFormState } from "../edgeDataConverter";
import { BaseConditionStrategy } from "./types";

/**
 * Default 조건 전략 (조건 없음)
 */
export class DefaultStrategy extends BaseConditionStrategy {
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void {
    // default는 추가 파싱 불필요
  }

  buildWhen(formState: EdgeFormState): WhenCondition {
    return {};
  }

  getLabel(formState: EdgeFormState): string {
    return "default";
  }
}
