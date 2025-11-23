import type { SwitchEdgeData, WhenCondition } from "~/models/workflow/types";
import type {
  ConditionMode,
  MultipleConditionType,
  SingleConditionType,
  SubCondition,
} from "./types";
import { strategyRegistry } from "./strategies";

/**
 * 각 조건 타입별 데이터
 */
export interface EqualsData {
  nodeId: string;
  path: string;
  value: string;
}

export interface ExistsData {
  nodeId: string;
  path: string;
}

export interface ContainsData {
  nodeId: string;
  path: string;
  search: string;
}

export interface RegexData {
  nodeId: string;
  path: string;
  pattern: string;
}

export interface ExprData {
  expr: string;
}

/**
 * EdgeConfigDialog의 폼 상태를 표현하는 인터페이스
 */
export interface EdgeFormState {
  conditionMode: ConditionMode;
  singleConditionType: SingleConditionType;
  multipleConditionType: MultipleConditionType;

  // 각 조건 타입별 데이터 (해당 타입일 때만 사용)
  equalsData: EqualsData;
  existsData: ExistsData;
  containsData: ContainsData;
  regexData: RegexData;
  exprData: ExprData;

  // 복합 조건
  subConditions: SubCondition[];
}

/**
 * 기본 폼 상태 값
 */
export const DEFAULT_FORM_STATE: EdgeFormState = {
  conditionMode: "single",
  singleConditionType: "default",
  multipleConditionType: "and",

  equalsData: { nodeId: "", path: "result.data", value: "" },
  existsData: { nodeId: "", path: "result" },
  containsData: { nodeId: "", path: "result.data", search: "" },
  regexData: { nodeId: "", path: "result.data", pattern: "" },
  exprData: { expr: "" },

  subConditions: [],
};

/**
 * 조건 타입 감지
 */
function detectConditionType(edgeData: SwitchEdgeData): SingleConditionType {
  if (edgeData.isDefault) return "default";
  if (edgeData.when?.equals) return "equals";
  if (edgeData.when?.exists) return "exists";
  if (edgeData.when?.expr) return "expr";
  if (edgeData.when?.regex) return "regex";
  if (edgeData.when?.contains) return "contains";
  return "default";
}

/**
 * 복합 조건 배열을 SubCondition[]로 파싱
 */
function parseSubConditions(conditions: WhenCondition[]): SubCondition[] {
  return conditions
    .map((cond, idx) => {
      const id = `sub-${Date.now()}-${idx}`;

      // 각 조건 타입에 맞는 전략 찾기
      for (const strategy of strategyRegistry.getAllStrategies()) {
        const subCondition = strategy.parseToSubCondition(cond, id);
        if (subCondition) {
          return subCondition;
        }
      }

      // 기본값
      return {
        id,
        type: "equals" as const,
        nodeId: "",
        path: "result.data",
        value: "",
      };
    })
    .filter((sub): sub is SubCondition => sub !== null);
}

/**
 * SwitchEdgeData를 EdgeFormState로 역직렬화
 */
export function parseEdgeData(edgeData?: SwitchEdgeData): EdgeFormState {
  if (!edgeData) {
    return { ...DEFAULT_FORM_STATE };
  }

  // 조건 모드 판별
  const conditionMode: ConditionMode =
    edgeData.when?.and || edgeData.when?.or ? "multiple" : "single";

  // 단일 조건 타입 판별
  const singleConditionType: SingleConditionType =
    detectConditionType(edgeData);

  // 복합 조건 타입
  const multipleConditionType: MultipleConditionType = edgeData.when?.and
    ? "and"
    : "or";

  // 기본 폼 상태로 시작
  const formState: Partial<EdgeFormState> = {
    ...DEFAULT_FORM_STATE,
    conditionMode,
    singleConditionType,
    multipleConditionType,
  };

  // 단일 조건인 경우, 해당 전략으로 파싱
  if (conditionMode === "single" && edgeData.when) {
    const strategy = strategyRegistry.getStrategy(singleConditionType);
    strategy.parseFromWhen(edgeData.when, formState);
  }

  // 복합 조건 파싱
  const conditions = edgeData.when?.and || edgeData.when?.or || [];
  formState.subConditions = parseSubConditions(conditions);

  return formState as EdgeFormState;
}

/**
 * EdgeFormState를 SwitchEdgeData로 직렬화
 */
export function buildEdgeData(formState: EdgeFormState): SwitchEdgeData {
  if (formState.conditionMode === "single") {
    return buildSingleCondition(formState);
  } else {
    return buildMultipleCondition(formState);
  }
}

/**
 * 단일 조건 직렬화
 */
function buildSingleCondition(formState: EdgeFormState): SwitchEdgeData {
  const { singleConditionType } = formState;

  // default 조건은 특별 처리
  if (singleConditionType === "default") {
    return {
      isDefault: true,
      conditionLabel: "default",
    };
  }

  const strategy = strategyRegistry.getStrategy(singleConditionType);

  // 전략을 사용해서 WhenCondition 생성
  const when = strategy.buildWhen(formState);
  const conditionLabel = strategy.getLabel(formState);

  return {
    when,
    conditionLabel,
    isDefault: false,
  };
}

/**
 * 복합 조건 (AND/OR) 직렬화
 */
function buildMultipleCondition(formState: EdgeFormState): SwitchEdgeData {
  const { multipleConditionType, subConditions } = formState;

  // 각 SubCondition을 해당 전략으로 WhenCondition으로 변환
  const conditions: WhenCondition[] = subConditions.map((sub) => {
    const strategy = strategyRegistry.getStrategy(sub.type);
    return strategy.buildFromSubCondition(sub);
  });

  if (multipleConditionType === "and") {
    return {
      when: {
        and: conditions,
      },
      conditionLabel: `AND (${conditions.length})`,
      isDefault: false,
    };
  } else {
    return {
      when: {
        or: conditions,
      },
      conditionLabel: `OR (${conditions.length})`,
      isDefault: false,
    };
  }
}
