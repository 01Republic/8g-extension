import type { NodeTypes } from "@xyflow/react";
import GenericBlockNode from "./GenericBlockNode";
import GroupNode from "./GroupNode";
import { AllBlockSchemas } from "scordi-extension";
import { blockLabels } from "8g-shared";

// 모든 블록 타입을 GenericBlockNode로 자동 등록 + 그룹 노드
export const workflowNodeTypes: NodeTypes = {
  ...Object.keys(AllBlockSchemas).reduce(
    (acc, blockName) => {
      acc[blockName] = GenericBlockNode;
      return acc;
    },
    {} as NodeTypes,
  ),
  group: GroupNode,
};

// blockLabels는 8g-shared에서 import
export { blockLabels };

/**
 * 필드 이름에 따른 한글 라벨
 */
export const fieldLabels: Record<string, string> = {
  name: "블록 타입",
  selector: "셀렉터",
  findBy: "찾기 방식",
  option: "옵션",
  waitForSelector: "셀렉터 대기",
  waitSelectorTimeout: "대기 시간 (ms)",
  multiple: "다중 선택",

  // GetTextBlock
  includeTags: "HTML 태그 포함",
  useTextContent: "textContent 사용",
  regex: "정규식 필터",
  prefixText: "접두사",
  suffixText: "접미사",

  // EventClickBlock
  textFilter: "텍스트 필터",

  // GetAttributeValueBlock
  attributeName: "속성 이름",

  // SetValueFormBlock
  setValue: "설정할 값",
  type: "폼 타입",

  // GetElementDataBlock
  includeText: "텍스트 포함",
  attributes: "추출할 속성 목록",
  includeSelector: "셀렉터 생성",
  includeXPath: "XPath 생성",

  // FetchApiBlock
  url: "URL",
  method: "HTTP 메서드",
  headers: "헤더",
  body: "요청 본문",
  timeout: "타임아웃 (ms)",
  parseJson: "JSON 파싱",
  returnHeaders: "응답 헤더 반환",

  // DataExtractBlock
  code: "JavaScript 코드",
  inputData: "입력 데이터",

  // TransformDataBlock
  sourceData: "소스 데이터",
  expression: "변환 표현식",

  // WaitForConditionBlock
  conditions: "조건",
  mode: "모드",
  pollingIntervalMs: "폴링 간격 (ms)",
  position: "UI 위치",
  urlPattern: "URL 패턴",
  elementExists: "요소 존재 확인",
  cookieExists: "쿠키 존재 확인",
  storageKey: "스토리지 키 확인",
  userConfirmation: "사용자 확인",
  message: "메시지",
  buttonText: "버튼 텍스트",

  // KeypressBlock
  key: "키",
  modifiers: "수정 키",

  // ScrollBlock
  scrollType: "스크롤 타입",
  distance: "스크롤 거리",
  maxScrolls: "최대 스크롤 횟수",
  waitAfterScroll: "스크롤 후 대기 시간",

  // CheckStatusBlock
  checkType: "확인 타입",
  title: "제목",
  description: "설명",
  notification: "알림 설정",
  options: "옵션",
  urgency: "긴급도",
  retryable: "재시도 가능",
  autoClick: "자동 클릭",
  clickDelay: "클릭 전 대기시간",
  fallbackToManual: "수동 모드 전환",
  customValidator: "사용자 정의 검증",

  // GetElementDataBlock
  extractors: "데이터 추출기",
  saveAs: "저장할 키",
  
  // NavigateBlock
  waitForLoad: "페이지 로드 대기",

  // WaitBlock
  duration: "대기 시간",

  // Additional fields
  prefix: "접두사",
  suffix: "접미사",
  filterByText: "텍스트 필터",
  clickAll: "모두 클릭",
};
