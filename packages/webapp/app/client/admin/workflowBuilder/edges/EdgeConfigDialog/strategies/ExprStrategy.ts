import type { WhenCondition } from "~/models/workflow/types";
import type { EdgeFormState } from "../edgeDataConverter";
import { BaseConditionStrategy } from "./types";

/**
 * Expr 조건 전략
 */
export class ExprStrategy extends BaseConditionStrategy {
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void {
    if (!when.expr) return;

    formState.exprData = {
      expr: when.expr,
    };
  }

  buildWhen(formState: EdgeFormState): WhenCondition {
    return {
      expr: formState.exprData.expr,
    };
  }

  getLabel(formState: EdgeFormState): string {
    const expr = formState.exprData.expr;
    return expr.length > 15 ? expr.substring(0, 15) + "..." : expr;
  }
}
