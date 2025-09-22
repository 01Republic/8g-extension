# 8G Extension 워크플로우 실행 아키텍처 제안

본 문서는 기존 "단일 Block 실행" 및 "Block 배열 순차 실행" 기능을 확장하여, 이전 단계의 결과를 기반으로 조건부 실행/분기/반복 등을 지원하는 "Workflow" 실행 스펙과 아키텍처를 제안합니다.

## 1. 목표

- 이전 Block(또는 Step)의 결과를 참조하여 다음 Step 실행 여부를 결정
- 조건 분기(if/switch), 실패 분기(onSuccess/onFailure) 지원
- 결과 값을 다음 Step의 입력으로 안전하게 전달(템플릿/바인딩)
- 타임아웃/재시도/지연 등 실행 제어 옵션 제공
- 현행 단일/배열 실행과의 완전한 하위 호환성 유지

## 2. 핵심 개념

- Workflow: 여러 Step으로 구성된 실행 단위. 각 Step은 하나의 Block 실행과 부가 옵션(조건, 분기, 바인딩 등)을 포함.
- Context: Workflow 실행 동안 축적되는 상태 저장소. 각 Step의 결과가 `context.steps[stepId]`에 저장되고, 템플릿/표현식에서 참조 가능.
- Condition: Step 수행 전 평가되어 실행 여부를 결정. 표현식(Expression) 또는 간결 JSON 조건식을 지원.
- Branching: `next`(기본 흐름), `onSuccess`, `onFailure`, `switch`를 통해 실행 경로를 제어.
- Binding(값 전달): 이후 Step의 Block 필드에 이전 결과를 안전하게 주입. 템플릿(`"${...}"`) 또는 구조적 `valueFrom`를 지원.

## 3. 타입 설계 (제안)

```typescript
// 공통: 기존 Block 타입 재사용
type BlockName =
  | 'get-text'
  | 'attribute-value'
  | 'get-value-form'
  | 'set-value-form'
  | 'clear-value-form'
  | 'element-exists'
  | 'event-click'
  | 'save-assets'
  | 'get-element-data';

interface BlockBase {
  name: BlockName;
  selector: string;
  findBy: 'cssSelector' | 'xpath';
  option?: {
    waitForSelector?: boolean;
    waitSelectorTimeout?: number;
    multiple?: boolean;
  };
  // ... 각 Block별 추가 필드 (현행과 동일)
}

// 표현식: 안전 평가를 위한 제한적 표현식 스펙
// - 좌변/우변에 context 접근 허용: $.steps.<stepId>.result, $.vars, $.now 등
// - 연산자: ==, !=, >, >=, <, <=, contains, startsWith, endsWith, regex
// - 논리: &&, ||, !
type ExpressionString = string; // 예: "$.steps.login.result.success == true && $.steps.title.result.data != ''"

// 구조적 조건식 (간단 케이스용)
type JsonCondition =
  | { exists: string }                                  // 경로 존재 여부
  | { equals: { left: string; right: any } }
  | { notEquals: { left: string; right: any } }
  | { contains: { value: string; search: any } }
  | { regex: { value: string; pattern: string; flags?: string } }
  | { and: JsonCondition[] }
  | { or: JsonCondition[] }
  | { not: JsonCondition };

type Condition = { expr?: ExpressionString; json?: JsonCondition };

// 값 바인딩: 템플릿 또는 경로 참조 기반 주입
// - template: "Product: ${$.steps.getTitle.result.data}"
// - valueFrom: "$.steps.stepId.result.data[0]"
type BindingValue = string | number | boolean | null | Record<string, any> | any[];

interface Binding {
  template?: string;   // 문자열 템플릿
  valueFrom?: string;  // JSONPath-like 경로
  default?: BindingValue; // 평가 실패 시 대체값
}

// Step 정의
interface WorkflowStep {
  id: string;             // 고유 Step ID (문자/숫자/하이픈 허용)
  title?: string;         // 가독성용

  // 실행 전 조건: 조건이 false면 해당 step은 SKIP됨
  when?: Condition;       

  // 실제 실행할 Block. 정적값 + 바인딩을 혼합해 구성 가능
  block?: BlockBase;      // block이 없는 step은 control-only 노드(분기/대기 등)

  // 분기/흐름 제어
  next?: string;          // 기본 다음 step id
  onSuccess?: string;     // block 실행 성공 시 다음 step id
  onFailure?: string;     // block 실행 실패 시 다음 step id

  // switch-case 스타일 분기
  switch?: Array<{
    when: Condition;      // 조건 만족 시 해당 next로 이동
    next: string;
  }>;

  // 실행 제어 옵션
  timeoutMs?: number;     // step 단위 타임아웃
  retry?: {               // 재시도 정책
    attempts: number;     // 총 시도 횟수 (기본 1)
    delayMs?: number;     // 시도 간 대기
    backoffFactor?: number; // 지수 백오프 배수 (기본 1: 고정)
  };
  delayAfterMs?: number;  // step 종료 후 다음 step 전 대기

  // 변수 저장: 평가 후 context.vars에 병합 (옵션)
  setVars?: Record<string, Binding | BindingValue>;
}

// Workflow 루트 정의
interface Workflow {
  version: '1.0';
  id?: string;
  title?: string;
  description?: string;
  start: string;             // 시작 step id
  steps: WorkflowStep[];     // step 목록
  defaultDelayMs?: number;   // 전역 step 간 대기 기본값
}

// SDK 요청/응답 (제안)
type CollectWorkflowRequest = {
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
};

interface WorkflowStepRunResult<T = any> {
  stepId: string;
  skipped: boolean;
  success: boolean;
  message?: string;
  result?: T;          // BlockResult 그대로 수용
  startedAt: string;
  finishedAt: string;
  attempts: number;
}

interface CollectWorkflowResult<T = any> {
  success: boolean;            // 워크플로우 전체 성공 여부(선택 정책에 따름)
  steps: WorkflowStepRunResult<T>[];
  targetUrl: string;
  timestamp: string;
  error?: string;              // 워크플로우 레벨 오류
}
```

## 4. 메시지/SDK 변경안

1) 새로운 외부 메시지 타입(권장)

```typescript
// 외부 메시지 (Webpage → Content Script)
interface CollectWorkflowMessage {
  type: '8G_COLLECT_WORKFLOW';
  requestId: string;
  targetUrl: string;
  workflow: Workflow;
  activateTab?: boolean;
  closeTabAfterCollection?: boolean;
}
```

2) 내부 메시지 타입

```typescript
// Content Script → Background
interface CollectWorkflowNewTabMessage {
  type: 'COLLECT_WORKFLOW_NEW_TAB';
  data: {
    targetUrl: string;
    workflow: Workflow;
    activateTab?: boolean;
    closeTabAfterCollection?: boolean;
  };
}
```

3) SDK 확장

```typescript
// EightGClient 신규 API (권장: collectData 유지, collectWorkflow 추가)
class EightGClient {
  async collectWorkflow(request: CollectWorkflowRequest): Promise<CollectWorkflowResult>;
}
```

하위 호환 대안: `collectData`에 `workflow` 필드를 추가하는 유니온도 가능하나, 명확한 의도를 위해 별도 메서드를 권장합니다.

## 5. 실행 흐름

1) SDK: `collectWorkflow` 호출 → `window.postMessage('8G_COLLECT_WORKFLOW')`
2) Content Script: ExternalMessageHandler가 수신 → Background로 전달(`COLLECT_WORKFLOW_NEW_TAB`)
3) Background: 새 탭 생성(TabManager) → `WorkflowRunner` 실행 시작
4) WorkflowRunner:
   - Context 초기화: `{ steps: {}, vars: {} }`
   - 현재 stepId = workflow.start
   - 루프:
     - step 조회, 조건(when) 평가 → false면 `skipped=true`, 다음 step 결정(next/onSuccess/onFailure/switch 우선순위 규칙에 따라)
     - block 있으면: 타임아웃/재시도 적용하여 `executeBlock(block)` 호출
     - 결과 기록: `context.steps[stepId] = { result, success, skipped }`
     - setVars 평가/병합
     - delayAfterMs 또는 defaultDelayMs 대기
     - 분기 규칙에 따라 다음 stepId 결정
   - 종료: 더 이상 next가 없으면 완료
5) 결과 집계 후 반환(steps 배열)

분기 우선순위(제안):
1. switch 매칭 → 해당 next
2. onSuccess/onFailure → 해당 next
3. next → 지정 next
4. 미지정 시 → 선언 순서의 다음 step (선형 fallback)

## 6. 조건/표현식 평가

- 경로 규칙(JSONPath-like):
  - `$`는 루트 컨텍스트
  - `$.steps.<stepId>.result` → 이전 step 결과
  - `$.steps.<stepId>.result.data` → BlockResult의 data 필드
  - `$.vars.<name>` → 수동 저장 변수
- 배열 처리: `contains`, `regex`는 배열에 대해 any 매칭으로 동작(옵션으로 `all: true` 확장 가능)
- 보안: 표현식은 샌드박스에서 평가하고, 전역 객체 접근 금지

## 7. 바인딩(값 전달)

모든 Block 필드는 정적 값 또는 바인딩(`Binding`)으로 구성 가능:

예)
```json
{
  "name": "get-text",
  "selector": "${$.vars.detailSelector}",
  "findBy": "cssSelector"
}
```

혹은 구조적 바인딩:
```json
{
  "selector": { "valueFrom": "$.steps.pickLink.result.data[0]", "default": ".title" }
}
```

평가 규칙:
- 객체 값에서 `Binding` 형태가 감지되면 재귀적으로 평가
- 문자열 템플릿은 `${}` 토큰만 치환
- 실패 시 `default` 사용, `default` 없으면 에러로 간주(옵션으로 무시 가능)

## 8. 에러/재시도/타임아웃

- `timeoutMs`: step 실행이 지정 시간 내 완료되지 않으면 취소로 간주, `onFailure` 분기 트리거
- `retry`: 실패 시 재시도, `delayMs` 대기 및 `backoffFactor` 반영(예: 500ms, factor=2 → 500,1000,2000)
- 실패 누적 정책: 워크플로우 전체 성공/실패 판단은 정책 결정 필요(default: 모든 step 성공 or 실패 허용 옵션 추가 가능)

## 9. 예시

### 9.1 조건부 실행(Skip)

```json
{
  "version": "1.0",
  "start": "checkModal",
  "steps": [
    {
      "id": "checkModal",
      "title": "모달 존재 확인",
      "block": {
        "name": "element-exists",
        "selector": ".modal.open",
        "findBy": "cssSelector",
        "option": { "waitForSelector": true, "waitSelectorTimeout": 1000 }
      },
      "onSuccess": "readModal",
      "onFailure": "end"
    },
    {
      "id": "readModal",
      "title": "모달 텍스트 추출",
      "block": {
        "name": "get-text",
        "selector": ".modal .content",
        "findBy": "cssSelector"
      }
    },
    { "id": "end", "title": "종료" }
  ]
}
```

### 9.2 분기(switch)

```json
{
  "version": "1.0",
  "start": "readStatus",
  "steps": [
    {
      "id": "readStatus",
      "block": {
        "name": "get-text",
        "selector": ".status",
        "findBy": "cssSelector",
        "useTextContent": true
      },
      "switch": [
        { "when": { "expr": "$.steps.readStatus.result.data == 'OK'" }, "next": "flowOk" },
        { "when": { "expr": "$.steps.readStatus.result.data == 'PENDING'" }, "next": "flowPending" }
      ],
      "next": "flowError"
    },
    { "id": "flowOk", "block": { "name": "event-click", "selector": ".go", "findBy": "cssSelector" } },
    { "id": "flowPending", "block": { "name": "event-click", "selector": ".wait", "findBy": "cssSelector" } },
    { "id": "flowError", "block": { "name": "event-click", "selector": ".retry", "findBy": "cssSelector" } }
  ]
}
```

### 9.3 바인딩으로 값 전달

```json
{
  "version": "1.0",
  "start": "pickLink",
  "steps": [
    {
      "id": "pickLink",
      "block": {
        "name": "attribute-value",
        "selector": ".item a",
        "findBy": "cssSelector",
        "option": { "multiple": true },
        "attributeName": "href"
      },
      "onSuccess": "openFirst"
    },
    {
      "id": "openFirst",
      "block": {
        "name": "event-click",
        "selector": { "valueFrom": "$.steps.pickLink.result.data[0]" },
        "findBy": "cssSelector"
      },
      "delayAfterMs": 1000,
      "next": "readTitle"
    },
    {
      "id": "readTitle",
      "block": {
        "name": "get-text",
        "selector": ".title",
        "findBy": "cssSelector"
      },
      "setVars": {
        "title": { "valueFrom": "$.steps.readTitle.result.data" }
      }
    }
  ]
}
```

## 10. 컴포넌트 변경 포인트

- SDK(`src/sdk/EightGClient.ts`): `collectWorkflow` 추가, 타입(`src/sdk/types.ts`) 확장
- Content(`src/content/**`): ExternalMessageHandler에 `8G_COLLECT_WORKFLOW` 처리 추가
- Background(`src/background/**`): `WorkflowRunner` 신규 모듈/클래스 추가
  - 조건/표현식 평가 유틸(`evaluateCondition`)
  - 바인딩 평가 유틸(`resolveBindings`)
  - 재시도/백오프 처리(`runWithRetry`)
  - 기존 `TabManager.executeBlock` 재사용

## 11. 하위 호환성

- 기존 `collectData({ block })` 및 `collectData({ block: [] })`는 그대로 유지
- 워크플로우는 별도 진입점(`collectWorkflow`)으로 제공하여 명시적 사용

## 12. 검증 및 로깅

- 스키마 검증: 워크플로우 JSON에 대한 정적 검증(Zod/JSON Schema)
- 실행 로그: step 시작/종료, 조건 평가 결과, 분기 결정, 재시도 내역, 소요 시간
- 디버그 플래그: `?debug=true`로 상세 로그 출력(Control Plane)

## 13. 보안 고려

- 표현식 샌드박스: 전역/네트워크/DOM 접근 금지, 허용된 빌트인만 노출
- 템플릿/바인딩 경로 화이트리스트: `$.steps`, `$.vars`만 허용
- 경로 해석 깊이/크기 제한 및 순환 참조 방지

## 14. 향후 확장

- 병렬 분기(Parallel) 및 Join 노드
- Loop 노드(`while`, `forEach`) with 안전 가드(최대 반복 수)
- 사용자 정의 함수/매크로(미니 런타임)
- 상태 스냅샷/재시작 체크포인트

---

본 제안은 최소 변경으로 실용적인 워크플로우를 도입하고, 점진적으로 분기·반복·병렬 등 고급 기능을 확장할 수 있도록 설계되었습니다.


