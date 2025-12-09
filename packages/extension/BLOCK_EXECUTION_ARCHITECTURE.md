# 8G Extension 블록 실행 아키텍처

## 개요

8G Extension은 웹페이지에서 데이터를 수집하고 자동화하기 위한 Chrome Extension입니다.

**중요**: 모든 블록 실행은 **워크플로우를 통해서만** 가능합니다. 단일 블록도 워크플로우로 실행해야 합니다.

## 빠른 시작

### 설치

```bash
npm install 8g-extension
```

### 기본 사용법

```typescript
import { EightGClient } from '8g-extension';

const client = new EightGClient();
await client.checkExtension();

// 워크플로우 실행
const result = await client.collectWorkflow({
  targetUrl: 'https://example.com',
  workflow: {
    version: '1.0',
    start: 'getTitle',
    steps: [
      {
        id: 'getTitle',
        block: {
          name: 'get-text',
          selector: '#title',
          findBy: 'cssSelector',
          option: {},
          useTextContent: true,
        },
      },
    ],
  },
});
```

## 지원 블록 목록 (29개)

### 데이터 추출 블록

**get-text** - 텍스트 추출

```typescript
{
  name: 'get-text',
  selector: '.title',
  findBy: 'cssSelector',
  option: {
    waitForSelector?: boolean,
    waitSelectorTimeout?: number,
    multiple?: boolean
  },
  useTextContent?: boolean,
  includeTags?: boolean,
  regex?: string,
  prefixText?: string,
  suffixText?: string,
  filterEmpty?: boolean,
  // 무한 스크롤 지원
  scrollToCollect?: boolean,
  scrollDistance?: number,
  scrollWaitMs?: number,
  maxScrollAttempts?: number
}
```

**attribute-value** - 속성 값 추출

```typescript
{
  name: 'attribute-value',
  selector: 'img',
  findBy: 'cssSelector',
  option: { multiple?: boolean },
  attributeName: 'src'
}
```

**get-element-data** - 복합 데이터 추출

```typescript
{
  name: 'get-element-data',
  selector: '.product',
  findBy: 'cssSelector',
  option: { multiple?: boolean },
  includeText?: boolean,
  includeTags?: boolean,
  useTextContent?: boolean,
  regex?: string,
  prefixText?: string,
  suffixText?: string,
  attributes?: string[],     // 추출할 속성 목록
  includeSelector?: boolean, // CSS 선택자 포함
  includeXPath?: boolean     // XPath 포함
}
```

**save-assets** - 이미지/미디어 수집

```typescript
{
  name: 'save-assets',
  selector: 'img',  // 기본값: 'img, audio, video, source'
  findBy: 'cssSelector',
  option: { multiple?: boolean },
  attributeName: 'src'
}
```

### 폼 처리 블록

**get-value-form** - 폼 값 가져오기

```typescript
{
  name: 'get-value-form',
  selector: 'input[name="email"]',
  findBy: 'cssSelector',
  option: {},
  type?: 'text-field' | 'select' | 'checkbox'
}
```

**set-value-form** - 폼 값 설정

```typescript
{
  name: 'set-value-form',
  selector: 'input[name="email"]',
  findBy: 'cssSelector',
  option: {},
  setValue: 'user@example.com',
  type?: 'text-field' | 'select' | 'checkbox'
}
```

**clear-value-form** - 폼 값 초기화

```typescript
{
  name: 'clear-value-form',
  selector: 'input[name="search"]',
  findBy: 'cssSelector',
  option: {},
  type?: 'text-field' | 'select' | 'checkbox'
}
```

**set-contenteditable** - Contenteditable 요소 설정

```typescript
{
  name: 'set-contenteditable',
  selector: '[contenteditable="true"]',
  findBy: 'cssSelector',
  option: {},
  setValue: '새로운 내용'
}
```

**paste-value** - 값 붙여넣기

```typescript
{
  name: 'paste-value',
  selector: 'input',
  findBy: 'cssSelector',
  option: {},
  value: '붙여넣을 값',
  useCdp?: boolean  // CDP 사용 여부 (기본값: true)
}
```

### 상호작용 블록

**event-click** - 클릭 이벤트

```typescript
{
  name: 'event-click',
  selector: '.button',
  findBy: 'cssSelector',
  option: {},
  textFilter?: {
    text: string,
    mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
  }
}
```

**keypress** - 키보드 입력

```typescript
{
  name: 'keypress',
  key: 'Enter',  // 'Escape', 'Tab', 'ArrowDown' 등
  code?: 'Enter',
  keyCode?: 13,
  modifiers?: ['Alt', 'Control', 'Meta', 'Shift']
}
// selector, findBy, option 불필요
```

**scroll** - 페이지 스크롤

```typescript
{
  name: 'scroll',
  scrollType: 'toBottom' | 'toElement' | 'byDistance' | 'untilLoaded',
  selector?: string,      // toElement일 때 필요
  distance?: number,      // byDistance, untilLoaded일 때 사용
  behavior?: 'auto' | 'smooth',
  maxScrolls?: number,    // untilLoaded일 때 최대 스크롤 횟수
  waitAfterScroll?: number  // 스크롤 후 대기 시간 (ms)
}
```

### 유틸리티 블록

**element-exists** - 요소 존재 확인

```typescript
{
  name: 'element-exists',
  selector: '.modal',
  findBy: 'cssSelector',
  option: {
    waitForSelector?: boolean,
    waitSelectorTimeout?: number
  }
}
// 결과: true/false
```

**wait** - 대기

```typescript
{
  name: 'wait',
  duration: 2000  // ms
}
// selector, findBy, option 불필요
```

**wait-for-condition** - 조건 대기 (자동/수동/혼합)

```typescript
{
  name: 'wait-for-condition',
  conditions: {
    // 자동 조건 (선택사항)
    urlPattern?: string,           // URL 정규식 패턴
    elementExists?: {               // 요소 존재 확인
      selector: string,
      findBy: 'cssSelector' | 'xpath'
    },
    cookieExists?: string,          // 쿠키 이름
    storageKey?: {                  // 스토리지 키 확인
      type: 'localStorage' | 'sessionStorage',
      key: string
    },
    // 수동 확인 (선택사항)
    userConfirmation?: boolean,     // 사용자 확인 버튼 표시
    message?: string,               // 표시할 메시지
    buttonText?: string             // 버튼 텍스트
  },
  mode?: 'auto' | 'manual' | 'auto-or-manual',  // 기본값: 'auto-or-manual'
  pollingIntervalMs?: number,      // 체크 주기 (기본값: 1000ms)
  timeoutMs?: number,              // 최대 대기 시간 (기본값: 300000ms)
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
// selector, findBy, option 불필요
// 결과: { success: boolean, reason: string, message?: string }
```

**navigate** - URL 이동

```typescript
{
  name: 'navigate',
  url: string,              // 이동할 URL
  waitForLoad?: boolean,    // 페이지 로드 대기 (기본값: true)
  timeout?: number          // 로드 타임아웃 (기본값: 30000ms)
}
// selector, findBy, option 불필요
// 결과: boolean (성공 여부)
```

**mark-border** - 요소 하이라이트

```typescript
{
  name: 'mark-border',
  selector: '.target',
  findBy: 'cssSelector',
  option: { multiple?: boolean },
  highlightMode?: 'border' | 'spotlight' | 'both',
  borderStyle?: {
    color?: string,
    width?: number,
    style?: 'solid' | 'dashed' | 'dotted'
  },
  spotlightOptions?: {
    overlayColor?: string,
    overlayOpacity?: number,
    showPointer?: boolean,
    showLabel?: boolean,
    labelText?: string,
    pulseAnimation?: boolean
  },
  textFilter?: {
    text: string,
    mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
  }
}
```

### API/Network 블록

**fetch-api** - 외부 API 호출

```typescript
{
  name: 'fetch-api',
  url: 'https://api.example.com/users',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  headers?: { [key: string]: string },
  body?: any,
  timeout?: number,
  parseJson?: boolean,
  returnHeaders?: boolean
}
// selector, findBy, option 불필요
// CORS 제약 없음 (Background에서 실행)
```

**network-catch** - 네트워크 요청 캡처

```typescript
{
  name: 'network-catch',
  urlPattern: string,           // URL 패턴 (정규식)
  method?: string,              // HTTP 메서드 필터
  status?: number | [number, number],  // 상태 코드 또는 범위
  mimeType?: string,            // MIME 타입 필터
  requestBodyPattern?: string,  // 요청 바디 패턴
  waitForRequest?: boolean,     // 요청 대기 여부
  waitTimeout?: number,         // 대기 타임아웃 (ms)
  returnAll?: boolean,          // 모든 매칭 요청 반환
  includeHeaders?: boolean      // 헤더 포함 여부
}
// selector, findBy, option 불필요
```

### AI/데이터 변환 블록

**ai-parse-data** - AI 데이터 파싱

```typescript
{
  name: 'ai-parse-data',
  apiKey: 'sk-...',
  provider?: 'openai' | 'anthropic',
  model?: string,
  sourceData: 'raw text data',
  prompt?: string,
  schemaDefinition: {
    type: 'object',
    shape: {
      name: { type: 'string', description: '상품명' },
      price: { type: 'number', description: '가격' },
      features: { type: 'array', description: '특징 목록' }
    }
  }
}
// selector, findBy, option 불필요
// OpenAI/Anthropic을 사용해서 비구조화 데이터를 구조화
```

**transform-data** - 데이터 변환 (JSONata)

```typescript
{
  name: 'transform-data',
  sourceData: { valueFrom: 'steps.getData.result.data' },
  expression: '$sum([price > 100].price)'  // JSONata 표현식
}
// selector, findBy, option 불필요
```

**export-data** - 데이터 내보내기

```typescript
{
  name: 'export-data',
  data: { valueFrom: 'steps.getData.result.data' },
  format: 'json' | 'csv' | 'xlsx',
  filename?: string,
  csvOptions?: {
    delimiter?: string,
    header?: boolean
  }
}
// selector, findBy, option 불필요
```

**apply-locale** - 데이터 로컬라이제이션

```typescript
{
  name: 'apply-locale',
  sourceData: { valueFrom: 'steps.getData.result.data' },
  locale: 'ko' | 'en' | 'ja' | ...,
  mappings: {
    [key: string]: {
      [locale: string]: string
    }
  }
}
// selector, findBy, option 불필요
```

### 실행 제어 블록

**execute-javascript** - JavaScript 실행 (CDP)

```typescript
{
  name: 'execute-javascript',
  code: 'return document.title',
  returnResult?: boolean,  // 결과 반환 여부
  timeout?: number         // 실행 타임아웃 (ms)
}
// selector, findBy, option 불필요
// Background service worker에서 CDP를 통해 실행
```

**throw-error** - 에러 발생

```typescript
{
  name: 'throw-error',
  message: 'LOGIN_FAILED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' |
           'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' |
           'SERVER_ERROR' | 'TIMEOUT' | 'CONNECTION_ERROR' | 'UNKNOWN_ERROR',
  data?: any  // 에러와 함께 전달할 데이터
}
// selector, findBy, option 불필요
```

## 블록 실행 파이프라인

```
1. BlockHandler.executeBlock(block)
   ↓
2. block.name으로 분기
   ↓
3. validate* 함수로 Zod 스키마 검증
   ↓
4. handler* 함수 실행 (실제 DOM/API 작업)
   ↓
5. BlockResult<T> 반환: { data, hasError?, message? }
```

## 중요 개념

### option 필드

대부분의 블록은 `option` 필드가 필수입니다 (비어있어도 `{}` 필요):

```typescript
{
  block: {
    name: 'get-text',
    selector: '.title',
    findBy: 'cssSelector',
    option: {}  // 필수!
  }
}
```

**예외 (selector, findBy, option 불필요):**

- `keypress`
- `wait`
- `fetch-api`
- `ai-parse-data`
- `transform-data`
- `export-data`
- `network-catch`
- `navigate`
- `wait-for-condition`
- `execute-javascript`
- `throw-error`
- `apply-locale`

### waitForSelector

동적으로 생성되는 요소를 기다릴 때 사용:

```typescript
{
  option: {
    waitForSelector: true,
    waitSelectorTimeout: 5000  // 최대 5초 대기
  }
}
```

### multiple 옵션

여러 요소의 데이터를 배열로 수집:

```typescript
{
  option: {
    multiple: true;
  }
}
// 결과: ['text1', 'text2', 'text3']
```

### scrollToCollect (무한 스크롤)

스크롤하면서 데이터를 수집 (get-text, get-element-data):

```typescript
{
  name: 'get-text',
  selector: '.item',
  findBy: 'cssSelector',
  option: { multiple: true },
  scrollToCollect: true,
  scrollDistance: 500,        // 스크롤 거리 (px)
  scrollWaitMs: 1000,         // 스크롤 후 대기 (ms)
  maxScrollAttempts: 20       // 최대 스크롤 횟수
}
```

### textFilter (요소 필터링)

텍스트로 요소 필터링 (event-click, mark-border):

```typescript
{
  name: 'event-click',
  selector: 'button',
  findBy: 'cssSelector',
  option: {},
  textFilter: {
    text: '확인',
    mode: 'exact'  // 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
  }
}
```

## 블록 결과 구조

```typescript
{
  data: any,           // 블록 실행 결과 데이터
  hasError?: boolean,  // 에러 발생 여부
  message?: string     // 에러 메시지 또는 정보
}
```

## 워크플로우 통합

모든 블록은 워크플로우 내에서 실행됩니다. 자세한 내용은 [WORKFLOW_EXECUTION_ARCHITECTURE.md](WORKFLOW_EXECUTION_ARCHITECTURE.md)를 참고하세요.

워크플로우 실행 시 `WorkflowRunner`는 `src/workflow/step-executor/` 하위 모듈을 통해 스텝을 순차/재귀적으로 실행합니다. 기본적인 block 반복(`scope: 'block'`)은 `repeat-executor`가 처리하고, 복수 스텝으로 구성된 서브트리를 반복하는 경우(`scope: 'subtree'`) 새 `subtree-executor`가 동일한 세그먼트 실행 로직을 재귀 호출하여 하위 노드 전체를 반복 실행합니다. 이 구조 덕분에 Runner는 탭 생성·상태 관리에 집중하고, 실행 로직은 step-executor 계층에서 일관되게 관리됩니다.

### 블록 간 데이터 전달

```typescript
{
  version: '1.0',
  start: 'getIds',
  steps: [
    {
      id: 'getIds',
      block: {
        name: 'get-element-data',
        selector: '.item',
        findBy: 'cssSelector',
        option: { multiple: true },
        includeText: true,
        attributes: ['data-id']
      },
      next: 'fetchDetail'
    },
    {
      id: 'fetchDetail',
      block: {
        name: 'fetch-api',
        // 이전 스텝 결과 참조
        url: { template: 'https://api.example.com/items/${steps.getIds.result.data[0].data-id}' },
        method: 'GET',
        parseJson: true
      }
    }
  ]
}
```

## 아키텍처

### 디렉토리 구조

```
src/blocks/
├── GetTextBlock.ts           # 텍스트 추출
├── GetAttributeValueBlock.ts # 속성 값 추출
├── GetElementDataBlock.ts    # 복합 데이터 추출
├── GetValueFormBlock.ts      # 폼 값 가져오기
├── SetValueFormBlock.ts      # 폼 값 설정
├── ClearValueFormBlock.ts    # 폼 값 초기화
├── SetContenteditableBlock.ts # Contenteditable 설정
├── PasteValueBlock.ts        # 값 붙여넣기
├── EventClickBlock.ts        # 클릭
├── KeypressBlock.ts          # 키보드 입력
├── ScrollBlock.ts            # 스크롤
├── ElementExistsBlock.ts     # 요소 존재 확인
├── WaitBlock.ts              # 대기
├── WaitForConditionBlock.ts  # 조건 대기 (자동/수동)
├── NavigateBlock.ts          # URL 이동
├── MarkBorderBlock.ts        # 요소 하이라이트
├── SaveAssetsBlock.ts        # 에셋 수집
├── FetchApiBlock.ts          # API 호출
├── NetworkCatchBlock.ts      # 네트워크 캡처
├── AiParseDataBlock.ts       # AI 파싱
├── TransformDataBlock.ts     # 데이터 변환
├── ExportDataBlock.ts        # 데이터 내보내기
├── ApplyLocaleBlock.ts       # 로컬라이제이션
├── ExecuteJavascriptBlock.ts # JavaScript 실행
├── ThrowErrorBlock.ts        # 에러 발생
├── types.ts                  # 공통 타입
└── index.ts                  # BlockHandler + 통합
```

### 각 블록 파일 구조

```typescript
// 1. Zod 스키마 정의
export const BlockNameSchema = z.object({
  name: z.literal('block-name'),
  selector: z.string(),
  // ...
});

// 2. TypeScript 타입
export type BlockNameBlock = z.infer<typeof BlockNameSchema>;

// 3. 검증 함수
export const validateBlockName = (block: Block): BlockNameBlock => {
  return BlockNameSchema.parse(block);
};

// 4. 핸들러 함수
export const handlerBlockName = async (block: BlockNameBlock): Promise<BlockResult<ReturnType>> => {
  // 실제 작업 수행
  return { data: result };
};
```

### BlockHandler 진입점

[src/blocks/index.ts](src/blocks/index.ts)의 `BlockHandler.executeBlock()`가 모든 블록 실행의 진입점입니다:

```typescript
export class BlockHandler {
  static async executeBlock(block: Block): Promise<BlockResult> {
    switch (block.name) {
      case 'get-text':
        return handlerGetText(validateGetTextBlock(block));
      case 'event-click':
        return handlerEventClick(validateEventClickBlock(block));
      case 'mark-border':
        return handlerMarkBorder(validateMarkBorderBlock(block));
      case 'network-catch':
        return handlerNetworkCatch(validateNetworkCatchBlock(block));
      case 'execute-javascript':
        return handlerExecuteJavascript(validateExecuteJavascriptBlock(block));
      case 'throw-error':
        return handlerThrowError(validateThrowErrorBlock(block));
      // ...
    }
  }
}
```

## 요소 선택

[src/content/elements/](src/content/elements/) 에서 셀렉터 해석 및 요소 탐색을 처리합니다:

- CSS 선택자 지원
- XPath 지원
- iframe 탐색 지원
- Shadow DOM 지원
- `waitForSelector`로 요소 대기

## 참고 문서

- [CLAUDE.md](CLAUDE.md) - 프로젝트 개요 및 아키텍처
- [WORKFLOW_EXECUTION_ARCHITECTURE.md](WORKFLOW_EXECUTION_ARCHITECTURE.md) - 워크플로우 실행 가이드
- [EXPORT_DATA_BLOCK_EXAMPLES.md](EXPORT_DATA_BLOCK_EXAMPLES.md) - 데이터 내보내기 예제
- [README.md](README.md) - 프로젝트 설치 및 실행
