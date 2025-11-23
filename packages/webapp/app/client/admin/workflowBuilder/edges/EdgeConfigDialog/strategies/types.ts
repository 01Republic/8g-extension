import type { WhenCondition, SwitchEdgeData } from "~/models/workflow/types";
import type { EdgeFormState } from "../edgeDataConverter";
import type { SubCondition } from "../types";

/**
 * 조건 전략의 공통 인터페이스
 * 각 조건 타입(equals, exists, contains, regex, expr)은 이 인터페이스를 구현
 */
export interface ConditionStrategy {
  /**
   * WhenCondition을 EdgeFormState의 일부로 파싱 (역직렬화)
   */
  parseFromWhen(when: WhenCondition, formState: Partial<EdgeFormState>): void;

  /**
   * EdgeFormState를 WhenCondition으로 빌드 (직렬화)
   */
  buildWhen(formState: EdgeFormState): WhenCondition;

  /**
   * 조건 라벨 생성
   */
  getLabel(formState: EdgeFormState): string;

  /**
   * SubCondition을 WhenCondition으로 변환 (복합 조건용)
   */
  buildFromSubCondition(sub: SubCondition): WhenCondition;

  /**
   * WhenCondition을 SubCondition으로 파싱 (복합 조건용)
   */
  parseToSubCondition(when: WhenCondition, id: string): SubCondition | null;
}

/**
 * 기본값을 제공하는 추상 클래스
 */
export abstract class BaseConditionStrategy implements ConditionStrategy {
  abstract parseFromWhen(
    when: WhenCondition,
    formState: Partial<EdgeFormState>,
  ): void;
  abstract buildWhen(formState: EdgeFormState): WhenCondition;
  abstract getLabel(formState: EdgeFormState): string;

  // 복합 조건 메서드는 기본 구현 제공 (override 가능)
  buildFromSubCondition(sub: SubCondition): WhenCondition {
    throw new Error("This strategy does not support sub-conditions");
  }

  parseToSubCondition(when: WhenCondition, id: string): SubCondition | null {
    return null;
  }
}
