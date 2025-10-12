## 8G Extension 사용 가이드

**중요**: 8G Extension v2.x부터 **모든 블록 실행은 워크플로우를 통해서만** 가능합니다. 단일 블록도 워크플로우로 래핑하여 실행해야 합니다.

이 문서는 실제 사용자(클라이언트 개발자)가 워크플로우 기능을 바로 사용할 수 있도록 하는 실전 가이드입니다.

### 설치·임포트

- 브라우저(로컬 파일) 또는 npm 패키지로 사용할 수 있습니다.

```html
<script type="module">
  import { EightGClient } from './dist/index.js';
  const client = new EightGClient();
  await client.checkExtension();
  // ...
</script>
```

#### npm에서 사용

```bash
npm install 8g-extension
# 또는
yarn add 8g-extension
```

```ts
// ESM
import { EightGClient } from '8g-extension';

// 타입도 함께 제공됩니다 (types: ./dist/sdk/index.d.ts)
const client = new EightGClient();
await client.checkExtension();
```

번들러(Next.js/Vite 등) 환경에서 `import { EightGClient } from '8g-extension'`만으로 동작합니다. React는 외부 의존으로 마크되어 있으며, SDK 사용에는 React가 필요하지 않습니다.

### 단일 블록 실행

단일 블록도 워크플로우로 래핑하여 실행합니다:

```ts
const workflow = {
  version: '1.0',
  start: 'getTitle',
  steps: [
    {
      id: 'getTitle',
      block: {
        name: 'get-text',
        selector: '#title',
        findBy: 'cssSelector',
        option: {},  // 필수: 비어있어도 {}로 넣어주세요
        useTextContent: true
      }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow
});
```

### 여러 블록 순차 실행

`next` 필드와 `delayAfterMs`로 순차 실행을 제어합니다:

```ts
const workflow = {
  version: '1.0',
  start: 'clickModal',
  steps: [
    {
      id: 'clickModal',
      block: { 
        name: 'event-click', 
        selector: '.open-modal-btn', 
        findBy: 'cssSelector', 
        option: { waitForSelector: true } 
      },
      delayAfterMs: 500,  // 모달 열리는 시간 대기
      next: 'readModal'
    },
    {
      id: 'readModal',
      block: { 
        name: 'get-text', 
        selector: '.modal.open .modal-content', 
        findBy: 'cssSelector', 
        option: { waitForSelector: true, waitSelectorTimeout: 2000 },
        useTextContent: true
      }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow
});
```

### 워크플로우 실행(분기/조건/바인딩/재시도/타임아웃)

```ts
const workflow = {
  version: '1.0',
  start: 'readStatus',
  steps: [
    {
      id: 'readStatus',
      block: { name: 'get-text', selector: '.status', findBy: 'cssSelector', useTextContent: true, option: {} },
      // 분기: JSON 조건식(권장) 또는 expr 문자열 모두 지원
      switch: [
        { when: { equals: { left: "$.steps.readStatus.result.data", right: 'OK' } }, next: 'flowOk' },
        { when: { equals: { left: "$.steps.readStatus.result.data", right: 'PENDING' } }, next: 'flowPending' },
      ],
      next: 'flowError', // 위 조건이 모두 false일 때 사용
    },
    { id: 'flowOk',      block: { name: 'event-click', selector: '.go',   findBy: 'cssSelector', option: {} }, next: 'openModal' },
    { id: 'flowPending', block: { name: 'event-click', selector: '.wait', findBy: 'cssSelector', option: {} }, next: 'openModal' },
    { id: 'flowError',   block: { name: 'event-click', selector: '.retry',findBy: 'cssSelector', option: {} }, next: 'openModal' },
    { id: 'openModal',   block: { name: 'event-click', selector: '.open-modal-btn', findBy: 'cssSelector', option: {} }, delayAfterMs: 500, next: 'readModal' },
    { id: 'readModal',   block: { name: 'get-text', selector: '.modal.open .modal-content', findBy: 'cssSelector', option: { waitForSelector: true, waitSelectorTimeout: 2000 } } },
  ],
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow,
  closeTabAfterCollection: true,
  activateTab: false,
});
```

### 실용 예제: 무한 스크롤 + 키보드 입력 + 대기

```ts
// 무한 스크롤 페이지에서 데이터 수집 후 ESC로 모달 닫기
const workflow = {
  version: '1.0',
  start: 'scrollToLoad',
  steps: [
    {
      id: 'scrollToLoad',
      block: { 
        name: 'scroll',
        scrollType: 'untilLoaded',
        distance: 800,
        maxScrolls: 50,
        waitAfterScroll: 1000
      },
      next: 'waitForContent'
    },
    {
      id: 'waitForContent',
      block: { name: 'wait', duration: 2000 }, // 2초 대기
      next: 'clickItem'
    },
    {
      id: 'clickItem',
      block: { 
        name: 'event-click',
        selector: '.item:nth-child(5)',
        findBy: 'cssSelector',
        option: {}
      },
      delayAfterMs: 500,
      next: 'getData'
    },
    {
      id: 'getData',
      block: {
        name: 'get-text',
        selector: '.modal .detail',
        findBy: 'cssSelector',
        option: { waitForSelector: true, waitSelectorTimeout: 3000 }
      },
      next: 'closeModal'
    },
    {
      id: 'closeModal',
      block: { name: 'keypress', key: 'Escape' },
      next: 'confirmClose'
    },
    {
      id: 'confirmClose',
      block: { name: 'wait', duration: 500 } // 모달 닫힘 확인
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: 'https://example.com',
  workflow,
  closeTabAfterCollection: true
});
```

### 빠른 시작 요약

- **모든 블록은 워크플로우로만 실행**: `collectWorkflow()` 사용
- 사용 순서: 클라이언트 생성 → 설치 체크 → 워크플로우 정의 → `collectWorkflow` 실행
- 블록은 JSON으로 정의하며, 모든 블록에 `option: {}`를 권장합니다(비어있어도 OK)
  - 예외: `keypress`, `wait`, `ai-parse-data` 블록은 `selector`, `findBy`, `option` 필드가 필요 없습니다
- 워크플로우는 `steps`에 스텝들을 나열하고, `start`로 시작 스텝을 지정합니다
- 순차 실행: `next` 필드로 다음 스텝 지정
- 분기 실행: `switch`(권장), `onSuccess`/`onFailure`
- 블록 간 대기: `delayAfterMs`로 스텝 간 지연 시간 설정
- 안정성: `retry`, `timeoutMs`, `when` 조건 활용

### 팁

- `waitForSelector`를 적절히 사용하면 동적 UI에서도 안정적으로 작동합니다
- `valueFrom`/`template` 바인딩으로 이전 스텝 결과를 다음 스텝에 전달할 수 있습니다
- `timeoutMs`로 스텝별 최대 실행 시간을 제한하세요
- 무한 스크롤 페이지: `scroll` 블록의 `untilLoaded` 타입 사용
- 모달 닫기: `keypress` 블록으로 Escape 키 입력
- 애니메이션 대기: `wait` 블록으로 충분한 시간 확보
- 외부 API 연동: `fetch-api` 블록으로 CORS 제약 없이 API 호출 (웹페이지 데이터를 외부로 전송 가능)
- 복잡한 데이터: `ai-parse-data`로 비구조화 데이터를 구조화된 JSON으로 변환

### 워크플로우 JSON 빠른 레퍼런스

- 루트
  - version: '1.0'
  - start: 시작 스텝 id
  - steps: 스텝 배열

- 스텝 필드
  - id: 고유 id
  - block?: 실제 실행할 블록(JSON) — 모든 블록은 `option: {}`가 필요합니다(비어있어도 {} 권장)
  - when?: 실행 전 조건
    - 문자열 표현식: `{ expr: "$.steps.prev.result.data == 'OK'" }`
    - JSON 조건식: `{ equals: { left: "$.steps.prev.result.data", right: 'OK' } }`
  - switch?: 분기 배열 `[{ when, next }]`
  - onSuccess?/onFailure?/next?: 다음 스텝 id
  - timeoutMs?: 스텝별 타임아웃(ms)
  - retry?: `{ attempts: number, delayMs?: number, backoffFactor?: number }`
  - delayAfterMs?: 스텝 종료 후 대기(ms)
  - setVars?: `context.vars`에 저장할 값. 정적 값 또는 바인딩 허용

- 바인딩(값 전달)
  - 템플릿 치환: `{ template: "Title: ${$.steps.readTitle.result.data}" }`
  - 경로 참조: `{ valueFrom: "$.steps.pickLink.result.data[0]", default: ".title" }`

### 조건식 작성 팁

- JSON 조건식을 권장합니다(런타임 안전성/가독성). 예:
  - `{ exists: "$.steps.step1.result" }`
  - `{ equals: { left: "$.steps.step1.result.data", right: "OK" } }`
  - `{ regex: { value: "$.steps.step1.result.data", pattern: "^OK$" } }`
  - `{ and: [ {exists: "$.steps.a"}, {equals: {left: "$.steps.b.result.data", right: 1}} ] }`

### 실행 규칙(중요)

- 분기 우선순위: `switch` → `onSuccess/onFailure` → `next` → 종료
- `delayAfterMs`: 해당 스텝 종료 후 다음 스텝 전에 대기
- 재시도: 실패 시 `attempts`만큼 재시도, `delayMs`와 `backoffFactor`로 대기 시간 증가

### 지원 블록 목록

모든 블록에는 기본적으로 `option: {}`가 필요합니다(비어있어도 OK).

**데이터 추출 블록:**
- `get-text`: 텍스트 추출 (정규식, prefix/suffix 지원)
- `attribute-value`: 속성 값 추출 (단일/다중)
- `get-element-data`: 복합 데이터 추출 (텍스트, 속성, 선택자, XPath)

**폼 처리 블록:**
- `get-value-form`: 폼 값 가져오기 (text-field, select, checkbox)
- `set-value-form`: 폼 값 설정
- `clear-value-form`: 폼 값 초기화

**상호작용 블록:**
- `event-click`: 클릭 이벤트 (텍스트 필터 지원)
- `keypress`: 키보드 입력 시뮬레이션 (Escape, Enter 등, modifier 키 지원)
- `scroll`: 페이지 스크롤 (toElement, toBottom, byDistance, untilLoaded)

**유틸리티 블록:**
- `element-exists`: 요소 존재 확인 (boolean)
- `wait`: 지정 시간 대기 (ms)
- `save-assets`: 이미지/미디어 URL 수집

**API/AI 블록:**
- `fetch-api`: 외부 API 호출 (GET, POST 등, CORS 제약 없음)
- `ai-parse-data`: AI 기반 데이터 파싱 (OpenAI, 스키마 정의 필요)

자세한 사용법은 `BLOCKS.md` 문서를 참고하세요.

---

### 자주 발생하는 이슈

- 블록 검증 에러: `option`이 누락되면 에러가 납니다. 비어있어도 `{}`를 넣으세요.
- 분기가 항상 첫 케이스로 감: JSON 조건식을 사용하거나, expr에서 문자열 비교 시 따옴표 포함 여부를 확인하세요.
- steps가 빈 배열로 옴: SDK 1.1.0 이상을 사용하거나, 응답의 `result.result.steps`를 파싱하도록 업데이트하세요.(현재 SDK 반영 완료)
- keypress/wait/fetch-api/ai-parse-data 블록: `selector`, `findBy`, `option` 필드가 필요하지 않습니다.
- API 호출 실패: `fetch-api` 블록은 Background에서 실행되므로 CORS 제약을 받지 않습니다. `host_permissions: ['<all_urls>']` 설정이 필요합니다.
 


