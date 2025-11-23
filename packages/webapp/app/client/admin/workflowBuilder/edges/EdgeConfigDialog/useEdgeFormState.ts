import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import type { SwitchEdgeData } from "~/models/workflow/types";
import type {
  ConditionMode,
  MultipleConditionType,
  SingleConditionType,
  SubCondition,
} from "./types";
import type {
  EdgeFormState,
  EqualsData,
  ExistsData,
  ContainsData,
  RegexData,
  ExprData,
} from "./edgeDataConverter";
import {
  parseEdgeData,
  buildEdgeData,
  DEFAULT_FORM_STATE,
} from "./edgeDataConverter";

interface UseEdgeFormStateProps {
  open: boolean;
  edgeData?: SwitchEdgeData;
}

interface UseEdgeFormStateReturn {
  // 메타 상태
  conditionMode: ConditionMode;
  singleConditionType: SingleConditionType;
  multipleConditionType: MultipleConditionType;

  setConditionMode: Dispatch<SetStateAction<ConditionMode>>;
  setSingleConditionType: Dispatch<SetStateAction<SingleConditionType>>;
  setMultipleConditionType: Dispatch<SetStateAction<MultipleConditionType>>;

  // 각 조건 타입별 데이터
  equalsData: EqualsData;
  existsData: ExistsData;
  containsData: ContainsData;
  regexData: RegexData;
  exprData: ExprData;

  setEqualsData: Dispatch<SetStateAction<EqualsData>>;
  setExistsData: Dispatch<SetStateAction<ExistsData>>;
  setContainsData: Dispatch<SetStateAction<ContainsData>>;
  setRegexData: Dispatch<SetStateAction<RegexData>>;
  setExprData: Dispatch<SetStateAction<ExprData>>;

  // 복합 조건
  subConditions: SubCondition[];
  setSubConditions: Dispatch<SetStateAction<SubCondition[]>>;

  // SwitchEdgeData로 빌드
  buildData: () => SwitchEdgeData;
}

/**
 * EdgeConfigDialog의 폼 상태를 관리하는 Custom Hook
 *
 * - 각 조건 타입별로 독립적인 상태 관리
 * - edgeData 변경 시 자동으로 파싱
 * - 빌드 로직 캡슐화
 */
export function useEdgeFormState({
  open,
  edgeData,
}: UseEdgeFormStateProps): UseEdgeFormStateReturn {
  const [formState, setFormState] = useState<EdgeFormState>(DEFAULT_FORM_STATE);

  // edgeData가 변경되거나 dialog가 열릴 때 state 초기화
  useEffect(() => {
    if (!open) return;

    const parsedState = parseEdgeData(edgeData);
    setFormState(parsedState);
  }, [open, edgeData]);

  // 메타 상태 setters
  const setConditionMode: Dispatch<SetStateAction<ConditionMode>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      conditionMode:
        typeof value === "function" ? value(prev.conditionMode) : value,
    }));
  };

  const setSingleConditionType: Dispatch<
    SetStateAction<SingleConditionType>
  > = (value) => {
    setFormState((prev) => ({
      ...prev,
      singleConditionType:
        typeof value === "function" ? value(prev.singleConditionType) : value,
    }));
  };

  const setMultipleConditionType: Dispatch<
    SetStateAction<MultipleConditionType>
  > = (value) => {
    setFormState((prev) => ({
      ...prev,
      multipleConditionType:
        typeof value === "function" ? value(prev.multipleConditionType) : value,
    }));
  };

  // 각 조건 타입별 데이터 setters
  const setEqualsData: Dispatch<SetStateAction<EqualsData>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      equalsData: typeof value === "function" ? value(prev.equalsData) : value,
    }));
  };

  const setExistsData: Dispatch<SetStateAction<ExistsData>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      existsData: typeof value === "function" ? value(prev.existsData) : value,
    }));
  };

  const setContainsData: Dispatch<SetStateAction<ContainsData>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      containsData:
        typeof value === "function" ? value(prev.containsData) : value,
    }));
  };

  const setRegexData: Dispatch<SetStateAction<RegexData>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      regexData: typeof value === "function" ? value(prev.regexData) : value,
    }));
  };

  const setExprData: Dispatch<SetStateAction<ExprData>> = (value) => {
    setFormState((prev) => ({
      ...prev,
      exprData: typeof value === "function" ? value(prev.exprData) : value,
    }));
  };

  // 복합 조건
  const setSubConditions: Dispatch<SetStateAction<SubCondition[]>> = (
    value,
  ) => {
    setFormState((prev) => ({
      ...prev,
      subConditions:
        typeof value === "function" ? value(prev.subConditions) : value,
    }));
  };

  // SwitchEdgeData로 빌드
  const buildData = () => {
    return buildEdgeData(formState);
  };

  return {
    // 메타 상태
    conditionMode: formState.conditionMode,
    singleConditionType: formState.singleConditionType,
    multipleConditionType: formState.multipleConditionType,

    setConditionMode,
    setSingleConditionType,
    setMultipleConditionType,

    // 각 조건 타입별 데이터
    equalsData: formState.equalsData,
    existsData: formState.existsData,
    containsData: formState.containsData,
    regexData: formState.regexData,
    exprData: formState.exprData,

    setEqualsData,
    setExistsData,
    setContainsData,
    setRegexData,
    setExprData,

    // 복합 조건
    subConditions: formState.subConditions,
    setSubConditions,

    buildData,
  };
}
