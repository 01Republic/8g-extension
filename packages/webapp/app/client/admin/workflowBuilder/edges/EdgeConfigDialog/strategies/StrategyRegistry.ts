import type { SingleConditionType, SubConditionType } from "../types";
import type { ConditionStrategy } from "./types";
import { DefaultStrategy } from "./DefaultStrategy";
import { EqualsStrategy } from "./EqualsStrategy";
import { ExistsStrategy } from "./ExistsStrategy";
import { ExprStrategy } from "./ExprStrategy";
import { RegexStrategy } from "./RegexStrategy";
import { ContainsStrategy } from "./ContainsStrategy";

/**
 * 조건 타입에 따라 적절한 Strategy를 제공하는 레지스트리
 */
export class StrategyRegistry {
  private strategies: Map<string, ConditionStrategy>;

  constructor() {
    this.strategies = new Map([
      ["default", new DefaultStrategy()],
      ["equals", new EqualsStrategy()],
      ["exists", new ExistsStrategy()],
      ["expr", new ExprStrategy()],
      ["regex", new RegexStrategy()],
      ["contains", new ContainsStrategy()],
    ]);
  }

  /**
   * 단일 조건 타입에 해당하는 전략 반환
   */
  getStrategy(type: SingleConditionType | SubConditionType): ConditionStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unknown condition type: ${type}`);
    }
    return strategy;
  }

  /**
   * 모든 등록된 전략 반환
   */
  getAllStrategies(): ConditionStrategy[] {
    return Array.from(this.strategies.values());
  }
}

// 싱글톤 인스턴스
export const strategyRegistry = new StrategyRegistry();
