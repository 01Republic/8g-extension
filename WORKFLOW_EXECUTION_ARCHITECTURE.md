# 8G Extension 워크플로우 실행 가이드

**중요**: 8G Extension v2.x부터 **모든 블록 실행은 워크플로우를 통해서만** 가능합니다. 단일 블록도 워크플로우로 래핑하여 실행해야 합니다.

## 목차

1. [설치 및 기본 사용](#설치-및-기본-사용)
2. [워크플로우 구조](#워크플로우-구조)
3. [실행 컨텍스트와 데이터 바인딩](#실행-컨텍스트와-데이터-바인딩)
4. [조건부 실행](#조건부-실행)
5. [반복 실행 (forEach/count)](#반복-실행)
6. [에러 처리 및 재시도](#에러-처리-및-재시도)
7. [실전 예제](#실전-예제)

## 설치 및 기본 사용

### 설치

```bash
npm install 8g-extension
# 또는
yarn add 8g-extension
```

### 기본 사용법

```typescript
import { EightGClient } from '8g-extension';

const client = new EightGClient();

// 1. 확장 설치 확인
await client.checkExtension();

// 2. 워크플로우 실행
const result = await client.collectWorkflow({
  targetUrl: 'https://example.com',
  workflow: {
    version: '1.0',
    start: 'step1',
    steps: [
      {
        id: 'step1',
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

## 워크플로우 구조

### Workflow 스키마

```typescript
{
  version: '1.0',              // 필수: 워크플로우 버전
  start: 'stepId',             // 필수: 시작 스텝 ID
  steps: [                     // 필수: 스텝 배열
    {
      id: 'stepId',            // 필수: 고유 스텝 ID
      block?: { ... },         // 선택: 실행할 블록
      when?: { ... },          // 선택: 실행 조건
      repeat?: { ... },        // 선택: 반복 설정 (forEach 또는 count)
      switch?: [...],          // 선택: 조건부 분기
      next?: 'nextStepId',     // 선택: 다음 스텝
      onSuccess?: 'stepId',    // 선택: 성공 시 다음 스텝
      onFailure?: 'stepId',    // 선택: 실패 시 다음 스텝
      retry?: { ... },         // 선택: 재시도 설정
      timeoutMs?: number,      // 선택: 타임아웃 (ms)
      delayAfterMs?: number,   // 선택: 스텝 후 대기 시간 (ms)
    }
  ],
  vars?: { ... }               // 선택: 워크플로우 초기 변수
}
```

### 스텝 실행 순서

1. **조건 평가** (`when`) - 조건이 false면 스킵
2. **블록 실행** (`block`) - 재시도 및 타임아웃 적용
3. **결과 저장** - 컨텍스트에 스텝 결과 기록
4. **다음 스텝 결정** - 우선순위: `switch` → `onSuccess/onFailure` → `next`
5. **대기** (`delayAfterMs`) - 다음 스텝 전 지연

## 실행 컨텍스트와 데이터 바인딩

### 실행 컨텍스트 구조

워크플로우 실행 중 `ExecutionContext`가 유지됩니다:

```typescript
{
  steps: {
    [stepId]: {
      result: any,      // 블록 실행 결과
      success: boolean, // 성공 여부
      skipped: boolean  // 스킵 여부
    }
  },
  vars: {              // 워크플로우 초기 변수 (workflow.vars로 전달)
    [key]: any
  },
  forEach?: {          // forEach 반복 중에만 존재
    item: any,         // 현재 배열 항목
    index: number,     // 현재 인덱스 (0부터 시작)
    total: number      // 전체 배열 길이
  },
  loop?: {             // count 반복 중에만 존재
    index: number,     // 현재 반복 인덱스 (0부터 시작)
    count: number      // 전체 반복 횟수
  }
}
```

### 데이터 바인딩

블록의 파라미터에 이전 스텝 결과를 참조할 수 있습니다.

#### 1. 템플릿 문자열 (`template`)

문자열 내에 변수를 삽입합니다:

```typescript
{
  id: 'fetchUser',
  block: {
    name: 'fetch-api',
    url: { template: 'https://api.example.com/users/${steps.getUserId.result.data}' },
    method: 'GET',
    parseJson: true
  }
}
```

**템플릿 문법:**

- `${steps.stepId.result.data}` - 스텝 결과 참조
- `${forEach.item.id}` - forEach 반복의 현재 항목
- `${forEach.index}` - forEach 반복의 현재 인덱스
- `${loop.index}` - count 반복의 현재 인덱스

#### 2. 값 참조 (`valueFrom`)

값을 직접 전달합니다 (타입 유지):

```typescript
{
  id: 'parseData',
  block: {
    name: 'ai-parse-data',
    apiKey: 'sk-...',
    sourceData: { valueFrom: 'steps.getText.result.data' },
    schemaDefinition: {
      type: 'object',
      shape: {
        name: { type: 'string', description: '상품명' },
        price: { type: 'number', description: '가격' }
      }
    }
  }
}
```

#### 3. 기본값 (`default`)

값이 없을 때 사용할 기본값:

```typescript
{
  url: {
    valueFrom: 'steps.getUrl.result.data',
    default: 'https://example.com'
  }
}
```

### JSONPath 참조 문법

- `steps.stepId.result.data` - 특정 스텝의 결과 데이터
- `steps.stepId.result.data[0]` - 배열의 첫 번째 항목
- `steps.stepId.result.data.user.name` - 중첩된 객체 속성
- `vars.varName` - 워크플로우 변수 참조
- `forEach.item` - forEach 반복의 현재 항목
- `forEach.index` - forEach 반복의 현재 인덱스
- `loop.index` - count 반복의 현재 인덱스

### 워크플로우 변수 (vars)

워크플로우 시작 시 초기 변수를 전달할 수 있습니다:

```typescript
const workflow = {
  version: '1.0',
  start: 'fetchUser',
  vars: {
    userId: '12345',
    apiKey: 'sk-...',
    baseUrl: 'https://api.example.com',
  },
  steps: [
    {
      id: 'fetchUser',
      block: {
        name: 'fetch-api',
        url: { template: '${vars.baseUrl}/users/${vars.userId}' },
        method: 'GET',
        headers: {
          Authorization: { template: 'Bearer ${vars.apiKey}' },
        },
        parseJson: true,
      },
      next: 'displayName',
    },
    {
      id: 'displayName',
      block: {
        name: 'get-text',
        selector: '.user-name',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
    },
  ],
};

const result = await client.collectWorkflow({
  targetUrl: 'https://example.com',
  workflow,
});
```

**장점:**

- 워크플로우를 재사용 가능하게 만듦
- 환경별로 다른 설정 값 사용 가능 (개발/운영)
- API 키, URL 등 설정값을 워크플로우 외부에서 주입

**예제: 동적 사용자 ID**

```typescript
const userId = getUserIdFromSomewhere(); // 동적으로 가져온 값

const workflow = {
  version: '1.0',
  start: 'fetchUserData',
  vars: {
    userId: userId,
    apiEndpoint: process.env.API_ENDPOINT,
  },
  steps: [
    {
      id: 'fetchUserData',
      block: {
        name: 'fetch-api',
        url: { template: '${vars.apiEndpoint}/users/${vars.userId}' },
        method: 'GET',
        parseJson: true,
      },
    },
  ],
};
```

## 조건부 실행

### when 조건 (스텝 실행 여부)

스텝을 실행할지 스킵할지 결정합니다.

#### JSON 조건 (권장)

```typescript
{
  id: 'conditionalStep',
  when: {
    equals: {
      left: 'steps.checkStatus.result.data',
      right: 'active'
    }
  },
  block: { /* ... */ }
}
```

**지원하는 JSON 조건:**

```typescript
// 존재 여부
{ exists: 'steps.stepId.result' }

// 같음
{ equals: { left: 'steps.stepId.result.data', right: 'value' } }

// 다름
{ notEquals: { left: 'steps.stepId.result.data', right: 'value' } }

// 포함
{ contains: { value: 'steps.stepId.result.data', search: 'substring' } }

// 정규식
{ regex: { value: 'steps.stepId.result.data', pattern: '^OK$', flags: 'i' } }

// 논리 연산
{ and: [ { exists: 'steps.a' }, { equals: { left: 'steps.b.result.data', right: 1 } } ] }
{ or: [ { equals: { left: 'steps.a', right: 1 } }, { equals: { left: 'steps.b', right: 2 } } ] }
{ not: { exists: 'steps.error.result' } }
```

#### 표현식 조건

```typescript
{
  id: 'conditionalStep',
  when: {
    expr: "steps.checkStatus.result.data === 'active'"
  },
  block: { /* ... */ }
}
```

### switch 분기 (다음 스텝 결정)

조건에 따라 다른 스텝으로 분기합니다:

```typescript
{
  id: 'checkStatus',
  block: {
    name: 'get-text',
    selector: '.status',
    findBy: 'cssSelector',
    option: {},
    useTextContent: true
  },
  switch: [
    {
      when: { equals: { left: 'steps.checkStatus.result.data', right: 'OK' } },
      next: 'handleOk'
    },
    {
      when: { equals: { left: 'steps.checkStatus.result.data', right: 'PENDING' } },
      next: 'handlePending'
    }
  ],
  next: 'handleError'  // 모든 조건이 false일 때
}
```

### 분기 우선순위

1. **switch** - 조건부 분기 (첫 번째 매칭)
2. **onSuccess/onFailure** - 실행 결과에 따른 분기
3. **next** - 무조건 다음 스텝
4. 없으면 **종료**

## 반복 실행

### forEach - 배열 반복

배열의 각 항목마다 블록을 실행합니다.

```typescript
{
  version: '1.0',
  start: 'getProductIds',
  steps: [
    {
      id: 'getProductIds',
      block: {
        name: 'get-element-data',
        selector: '.product',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [
          { type: 'attribute', attribute: 'data-id', saveAs: 'id' }
        ]
      },
      next: 'fetchEachProduct'
    },
    {
      id: 'fetchEachProduct',
      repeat: {
        forEach: 'steps.getProductIds.result.data',  // 배열 경로
        continueOnError: true,    // 에러 발생해도 계속
        delayBetween: 200,        // 각 반복 사이 200ms 대기
        scope: 'block'            // block 반복 (기본값이므로 생략 가능)
      },
      block: {
        name: 'fetch-api',
        url: { template: 'https://api.example.com/products/${forEach.item.id}' },
        method: 'GET',
        parseJson: true
      }
    }
  ]
}
```

**forEach 컨텍스트 변수:**

- `forEach.item` - 현재 배열 항목
- `forEach.index` - 현재 인덱스 (0부터)
- `forEach.total` - 전체 배열 길이

**결과:** 결과는 배열로 수집됩니다

```typescript
steps.fetchEachProduct.result.data = [result1, result2, result3, ...]
```

### count - 고정 횟수 반복

지정된 횟수만큼 블록을 반복 실행합니다.

```typescript
{
  id: 'scrollMultipleTimes',
  repeat: {
    count: 10,           // 10번 반복
    delayBetween: 500,   // 각 반복 사이 500ms 대기
    scope: 'block'
  },
  block: {
    name: 'scroll',
    scrollType: 'byDistance',
    distance: 500
  }
}
```

**동적 count:**

```typescript
{
  id: 'dynamicRepeat',
  repeat: {
    count: 'steps.getPageCount.result.data'  // 이전 스텝 결과 사용
  },
  block: { /* ... */ }
}
```

**loop 컨텍스트 변수:**

- `loop.index` - 현재 반복 인덱스 (0부터)
- `loop.count` - 전체 반복 횟수

### repeat 옵션

```typescript
{
  forEach?: string;          // 배열 경로 (forEach 모드)
  count?: number | string;   // 반복 횟수 (count 모드)
  continueOnError?: boolean; // true: 에러 발생해도 계속 (기본값: false)
  delayBetween?: number;     // 반복 사이 대기 시간 (ms)
  scope?: 'block' | 'subtree'; // 반복 대상 (기본값: 'block')
  subtreeEnd?: string;       // scope='subtree'일 때 반복을 끝내고 이어갈 step ID
}
```

**주의:** `forEach`와 `count`는 동시에 사용할 수 없습니다.

#### Subtree repeat (확장)

`scope: 'subtree'`를 사용하면 단일 블록이 아니라 특정 스텝에서 시작해 `subtreeEnd` 앞까지의 서브 그래프 전체를 반복할 수 있습니다. 각 iteration은 독립적인 서브워크플로우 실행으로 취급되며, iteration별 세부 결과와 에러 정보가 반복 스텝의 결과에 요약되어 저장됩니다.

```typescript
{
  id: 'fillForm',
  repeat: {
    forEach: 'steps.listForms.result.data',
    scope: 'subtree',
    subtreeEnd: 'afterForm',
    continueOnError: false,
  },
  block: {
    name: 'set-value-form',
    selector: '.form input',
    findBy: 'cssSelector',
    option: {},
    value: { template: '${forEach.item.value}' },
  },
  next: 'submitForm'
},
{
  id: 'submitForm',
  block: {
    name: 'event-click',
    selector: '.submit',
    findBy: 'cssSelector',
    option: {},
  },
  next: 'verifyForm'
},
{
  id: 'verifyForm',
  block: {
    name: 'element-exists',
    selector: '.success',
    findBy: 'cssSelector',
    option: {},
  },
  next: 'afterForm'
},
{
  id: 'afterForm',
  // subtreeEnd로 지정된 스텝. 반복이 끝나면 여기서 계속 진행.
  block: null,
  next: 'finishAll'
}
```

반복이 끝나면 워크플로우는 자동으로 `subtreeEnd`에서 이어서 실행됩니다. `continueOnError`, `delayBetween`, `retry`, `timeoutMs` 등의 옵션은 기존 block repeat과 동일하게 적용되며, 내부적으로 `executeWorkflowSegment`가 재귀적으로 서브트리를 실행합니다.

## 에러 처리 및 재시도

### retry - 재시도 설정

실패 시 자동으로 재시도합니다:

```typescript
{
  id: 'unstableStep',
  block: { /* ... */ },
  retry: {
    attempts: 3,           // 최대 3번 시도
    delayMs: 1000,        // 재시도 전 1초 대기
    backoffFactor: 2      // 대기 시간을 2배씩 증가 (1s → 2s → 4s)
  }
}
```

### timeoutMs - 타임아웃

스텝 실행 시간 제한:

```typescript
{
  id: 'slowStep',
  block: { /* ... */ },
  timeoutMs: 5000  // 5초 이내에 완료되지 않으면 실패
}
```

### onSuccess / onFailure - 결과 기반 분기

성공/실패에 따라 다른 경로로 이동:

```typescript
{
  id: 'riskyStep',
  block: { /* ... */ },
  onSuccess: 'successHandler',
  onFailure: 'errorHandler'
}
```

### continueOnError - 반복 중 에러 처리

forEach/count 반복 중 에러가 발생해도 계속 진행:

```typescript
{
  id: 'fetchMultiple',
  repeat: {
    forEach: 'steps.getIds.result.data',
    continueOnError: true  // 일부 실패해도 나머지 계속 실행
  },
  block: { /* ... */ }
}
```

## 실전 예제

### 예제 1: 로그인 후 데이터 수집

```typescript
const workflow = {
  version: '1.0',
  start: 'inputEmail',
  steps: [
    {
      id: 'inputEmail',
      block: {
        name: 'set-value-form',
        selector: 'input[name="email"]',
        findBy: 'cssSelector',
        option: {},
        value: 'user@example.com',
      },
      delayAfterMs: 200,
      next: 'inputPassword',
    },
    {
      id: 'inputPassword',
      block: {
        name: 'set-value-form',
        selector: 'input[name="password"]',
        findBy: 'cssSelector',
        option: {},
        value: 'password123',
      },
      delayAfterMs: 200,
      next: 'clickLogin',
    },
    {
      id: 'clickLogin',
      block: {
        name: 'event-click',
        selector: 'button[type="submit"]',
        findBy: 'cssSelector',
        option: {},
      },
      delayAfterMs: 2000, // 로그인 처리 대기
      next: 'checkLoginSuccess',
    },
    {
      id: 'checkLoginSuccess',
      block: {
        name: 'element-exists',
        selector: '.user-profile',
        findBy: 'cssSelector',
        option: { waitForSelector: true, waitSelectorTimeout: 3000 },
      },
      onSuccess: 'collectData',
      onFailure: 'loginFailed',
    },
    {
      id: 'collectData',
      block: {
        name: 'get-text',
        selector: '.user-name',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
    },
    {
      id: 'loginFailed',
      block: {
        name: 'get-text',
        selector: '.error-message',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
    },
  ],
};
```

### 예제 2: 무한 스크롤 + 데이터 수집

```typescript
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
        waitAfterScroll: 1000,
      },
      next: 'waitForContent',
    },
    {
      id: 'waitForContent',
      block: {
        name: 'wait',
        duration: 2000,
      },
      next: 'getItems',
    },
    {
      id: 'getItems',
      block: {
        name: 'get-element-data',
        selector: '.item',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [
          { type: 'text', saveAs: 'title', selector: '.title' },
          { type: 'attribute', attribute: 'href', saveAs: 'link', selector: 'a' },
          { type: 'attribute', attribute: 'data-id', saveAs: 'id' },
        ],
      },
    },
  ],
};
```

### 예제 3: 페이지네이션 처리

```typescript
const workflow = {
  version: '1.0',
  start: 'getPageCount',
  steps: [
    {
      id: 'getPageCount',
      block: {
        name: 'get-text',
        selector: '.total-pages',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
      next: 'collectPages',
    },
    {
      id: 'collectPages',
      repeat: {
        count: 'steps.getPageCount.result.data',
        delayBetween: 1000,
      },
      block: {
        name: 'get-element-data',
        selector: '.item',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [{ type: 'text', saveAs: 'title' }],
      },
      next: 'clickNextPage',
    },
    {
      id: 'clickNextPage',
      when: {
        notEquals: {
          left: 'loop.index',
          right: { valueFrom: 'steps.getPageCount.result.data' },
        },
      },
      block: {
        name: 'event-click',
        selector: '.next-page',
        findBy: 'cssSelector',
        option: {},
      },
      delayAfterMs: 1000,
      next: 'collectPages',
    },
  ],
};
```

### 예제 4: 외부 API 연동

```typescript
const workflow = {
  version: '1.0',
  start: 'getProductIds',
  steps: [
    {
      id: 'getProductIds',
      block: {
        name: 'get-element-data',
        selector: '.product',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [{ type: 'attribute', attribute: 'data-id', saveAs: 'id' }],
      },
      next: 'enrichWithApi',
    },
    {
      id: 'enrichWithApi',
      repeat: {
        forEach: 'steps.getProductIds.result.data',
        continueOnError: true,
        delayBetween: 500,
      },
      block: {
        name: 'fetch-api',
        url: { template: 'https://api.example.com/products/${forEach.item.id}' },
        method: 'GET',
        parseJson: true,
        headers: {
          Authorization: 'Bearer YOUR_TOKEN',
        },
      },
      retry: {
        attempts: 3,
        delayMs: 1000,
        backoffFactor: 2,
      },
    },
  ],
};
```

### 예제 5: 데이터 변환 (transform-data)

JSONata를 사용하여 이전 스텝의 데이터를 변환/필터링/집계할 수 있습니다.

```typescript
const workflow = {
  version: '1.0',
  start: 'getProducts',
  steps: [
    {
      id: 'getProducts',
      block: {
        name: 'get-element-data',
        selector: '.product',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [
          { type: 'text', selector: '.name', saveAs: 'name' },
          { type: 'text', selector: '.price', saveAs: 'price' },
        ],
      },
      next: 'transformData',
    },
    {
      id: 'transformData',
      block: {
        name: 'transform-data',
        sourceData: { valueFrom: 'steps.getProducts.result.data' },
        expression: '$sum([price > 100].price)', // 100원 이상 상품의 합계
      },
      next: 'filterProducts',
    },
    {
      id: 'filterProducts',
      block: {
        name: 'transform-data',
        sourceData: { valueFrom: 'steps.getProducts.result.data' },
        expression: '[price > 100]', // 100원 이상 상품만 필터링
      },
    },
  ],
};
```

**JSONata 표현식 예제:**

- 필터링: `[price > 100]`
- 집계: `$sum(items.price)`, `$average(items.price)`, `$max(items.price)`
- 조건: `count > 10 ? "high" : "low"`
- 변환: `$map(items, function($v) { { "id": $v.id, "total": $v.price * 1.1 } })`
- 문자열: `$uppercase(text)`, `$lowercase(text)`

### 예제 6: AI 파싱

```typescript
const workflow = {
  version: '1.0',
  start: 'getRawText',
  steps: [
    {
      id: 'getRawText',
      block: {
        name: 'get-text',
        selector: '.product-description',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
      next: 'parseWithAi',
    },
    {
      id: 'parseWithAi',
      block: {
        name: 'ai-parse-data',
        apiKey: 'sk-...',
        provider: 'openai',
        sourceData: { valueFrom: 'steps.getRawText.result.data' },
        schemaDefinition: {
          type: 'object',
          shape: {
            name: { type: 'string', description: '상품명' },
            price: { type: 'number', description: '가격 (숫자만)' },
            category: { type: 'string', description: '카테고리' },
            features: { type: 'array', description: '주요 특징 목록' },
          },
        },
      },
    },
  ],
};
```

### 예제 6-1: AI 파싱 + 통화 스키마 (Schema.currency)

SDK는 다양한 통화 정보를 포함한 통합 스키마를 제공합니다. `Schema.currency()`를 사용하면 40개 통화 코드와 27개 통화 심볼, 8개 포맷 패턴을 지원하는 통화 필드를 쉽게 정의할 수 있습니다.

```typescript
import { EightGClient, createSchema, Schema } from '8g-extension';

const client = new EightGClient();

const workflow = {
  version: '1.0',
  start: 'getBillingInfo',
  vars: {
    apiKey: 'sk-...',
  },
  steps: [
    {
      id: 'getBillingInfo',
      block: {
        name: 'get-text',
        selector: '.billing-section',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
      next: 'parseWithAi',
    },
    {
      id: 'parseWithAi',
      block: {
        name: 'ai-parse-data',
        apiKey: { valueFrom: 'vars.apiKey' },
        sourceData: { valueFrom: 'steps.getBillingInfo.result.data' },
        schemaDefinition: createSchema({
          planName: Schema.string({ description: '플랜 이름' }),
          // 통화 스키마 사용 - 모든 통화 지원
          currentCycleBillAmount: Schema.currency({ description: '현재 주기 결제 금액' }),
          unitPrice: Schema.currency({ description: '단위 가격' }),
          nextPaymentDue: Schema.string({ description: '다음 결제일 (YYYY-MM-DD)' }),
          cycleTerm: Schema.string({
            enum: ['MONTHLY', 'YEARLY'] as const,
            description: '결제 주기',
          }),
          isFreeTier: Schema.boolean({ description: '무료 티어 여부' }),
          paidMemberCount: Schema.number({ description: '결제 멤버 수' }),
        }),
      },
    },
  ],
};

const result = await client.collectWorkflow({
  targetUrl: 'https://example.com/billing',
  workflow,
});
```

**지원하는 통화 코드 (40개):**

- 주요 통화: `USD`, `EUR`, `KRW`, `GBP`, `CAD`, `JPY`, `CNY`
- 아시아: `VND`, `INR`, `TWD`, `HKD`, `IDR`, `SGD`, `THB`, `PHP`, `MYR`
- 유럽: `CHF`, `SEK`, `NOK`, `DKK`, `PLN`, `CZK`, `HUF`, `RON`, `BGN`, `TRY`, `RUB`
- 중동/아프리카: `ILS`, `ZAR`, `AED`, `SAR`, `EGP`
- 아메리카: `MXN`, `BRL`, `ARS`, `CLP`, `COP`
- 오세아니아: `AUD`, `NZD`

**지원하는 통화 심볼 (27개):**
`$`, `₩`, `€`, `£`, `¥`, `₫`, `₹`, `NT$`, `Rp`, `₣`, `฿`, `R$`, `₺`, `₽`, `kr`, `₪`, `R`, `zł`, `₱`, `Kč`, `E£`, `RM`, `Ft`, `د.إ`, `﷼`, `L`, `лв`

**지원하는 포맷 패턴 (8개):**
`%s%u`, `%s%n`, `%u%s`, `%n%s`, `%s %u`, `%s %n`, `%u %s`, `%n %s`

- `%s`: 통화 심볼
- `%u` / `%n`: 금액

**Schema.currency() 특징:**

- 단일 통합 스키마로 모든 통화 지원
- AI가 자동으로 적절한 통화 코드, 심볼, 포맷을 선택
- 5개 필드 포함: `code`, `symbol`, `format`, `amount`, `text`

**결과 예시:**

```json
{
  "planName": "Pro",
  "currentCycleBillAmount": {
    "code": "USD",
    "symbol": "$",
    "format": "%s%u",
    "amount": 57.75,
    "text": "US$57.75"
  },
  "unitPrice": {
    "code": "USD",
    "symbol": "$",
    "format": "%s%u",
    "amount": 52.5,
    "text": "US$52.50"
  },
  "nextPaymentDue": "2025-11-18",
  "cycleTerm": "MONTHLY",
  "isFreeTier": false,
  "paidMemberCount": 6
}
```

**다국어 통화 지원 예시:**

```typescript
// AI가 자동으로 한국어, 영어, 일본어 등 다양한 통화를 인식
const multiCurrencyWorkflow = {
  version: '1.0',
  start: 'parsePrice',
  steps: [
    {
      id: 'parsePrice',
      block: {
        name: 'ai-parse-data',
        apiKey: 'sk-...',
        sourceData: { valueFrom: 'steps.getPriceText.result.data' },
        schemaDefinition: createSchema({
          // 모든 통화를 자동으로 파싱
          originalPrice: Schema.currency({ description: '원래 가격' }),
          discountPrice: Schema.currency({ description: '할인 가격', optional: true }),
          shippingCost: Schema.currency({ description: '배송비', optional: true }),
        }),
      },
    },
  ],
};

// 입력: "₩50,000원, 할인가 $45.00, 배송비 €5.99"
// 출력: 각 통화가 자동으로 올바른 코드와 심볼로 파싱됨
```

### 예제 7: 로그인 대기 (wait-for-condition)

```typescript
const workflow = {
  version: '1.0',
  start: 'navigateToLogin',
  steps: [
    {
      id: 'navigateToLogin',
      block: {
        name: 'navigate',
        url: 'https://example.com/login',
        waitForLoad: true,
      },
      delayAfterMs: 1000,
      next: 'waitForLogin',
    },
    {
      id: 'waitForLogin',
      block: {
        name: 'wait-for-condition',
        conditions: {
          // 자동 조건: 로그인 성공 시 URL 변경 또는 프로필 요소 등장
          urlPattern: 'https://example\\.com/dashboard',
          elementExists: {
            selector: '.user-profile',
            findBy: 'cssSelector',
          },
          // 수동 확인: 사용자가 로그인 완료 버튼 클릭
          userConfirmation: true,
          message: '로그인을 완료하셨나요?',
          buttonText: '로그인 완료',
        },
        mode: 'auto-or-manual', // 자동 조건 또는 수동 확인 중 먼저 충족되는 것
        pollingIntervalMs: 1000,
        timeoutMs: 300000, // 5분
        position: 'bottom-right',
      },
      onSuccess: 'collectData',
      onFailure: 'handleLoginTimeout',
    },
    {
      id: 'collectData',
      block: {
        name: 'get-text',
        selector: '.welcome-message',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
    },
    {
      id: 'handleLoginTimeout',
      block: {
        name: 'get-text',
        selector: 'body',
        findBy: 'cssSelector',
        option: {},
        useTextContent: true,
      },
    },
  ],
};
```

### 예제 8: 다중 페이지 네비게이션

```typescript
const workflow = {
  version: '1.0',
  start: 'navigateToPage1',
  vars: {
    pages: ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'],
  },
  steps: [
    {
      id: 'navigateToPage1',
      repeat: {
        forEach: 'vars.pages',
        delayBetween: 2000,
      },
      block: {
        name: 'navigate',
        url: { valueFrom: 'forEach.item' },
        waitForLoad: true,
        timeout: 30000,
      },
      delayAfterMs: 1000,
      next: 'collectPageData',
    },
    {
      id: 'collectPageData',
      repeat: {
        forEach: 'vars.pages',
        delayBetween: 2000,
      },
      block: {
        name: 'get-element-data',
        selector: '.content',
        findBy: 'cssSelector',
        option: { multiple: true },
        extractors: [
          { type: 'text', selector: '.title', saveAs: 'title' },
          { type: 'text', selector: '.description', saveAs: 'description' },
        ],
      },
    },
  ],
};
```

## ExecutionContext 헬퍼 함수

워크플로우 실행 후 `context`에서 데이터를 쉽게 추출할 수 있습니다.

```typescript
const result = await client.collectWorkflow({ ... });

// Step 데이터 추출 (가장 많이 사용)
const products = EightGClient.getStepData(result.context, 'getProducts');

// 변수 추출
const userId = EightGClient.getVar(result.context, 'userId');

// 경로로 추출
const firstProduct = EightGClient.getFromContext(result.context, 'steps.getProducts.result.data.0');

// Step 전체 결과
const stepResult = EightGClient.getStepResult(result.context, 'getProducts');
console.log(stepResult.success, stepResult.skipped);
```

## 참고 사항

### 블록 option 필드

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

**예외:** `keypress`, `wait`, `fetch-api`, `ai-parse-data`, `navigate`, `wait-for-condition`, `check-status` 블록은 `selector`, `findBy`, `option` 불필요

### delayAfterMs 활용

애니메이션이나 비동기 UI 업데이트가 있는 경우 충분한 대기 시간을 설정하세요:

```typescript
{
  id: 'clickModal',
  block: { /* ... */ },
  delayAfterMs: 500  // 모달 열리는 시간 대기
}
```

### waitForSelector 활용

동적으로 생성되는 요소를 기다릴 때 사용:

```typescript
{
  block: {
    name: 'get-text',
    selector: '.dynamic-content',
    findBy: 'cssSelector',
    option: {
      waitForSelector: true,
      waitSelectorTimeout: 5000  // 최대 5초 대기
    }
  }
}
```

### 예제 8: 상태 확인 (Side Panel + CDP Auto-click)

`check-status` 블록을 사용하여 워크플로우 실행 중 사용자 상태를 확인할 수 있습니다. 자동 클릭 기능을 사용하면 사용자 개입 없이 자동으로 확인됩니다.

#### 수동 모드 (기본)

```typescript
const workflow = {
  version: '1.0',
  start: 'checkLogin',
  steps: [
    {
      id: 'checkLogin',
      block: {
        name: 'check-status',
        checkType: 'login',
        title: '로그인 상태 확인',
        description: '계속하려면 로그인이 필요합니다',
        notification: {
          message: '로그인 확인 필요 🔐',
          urgency: 'high'
        },
        options: {
          timeoutMs: 60000,
          retryable: true
        }
      },
      onSuccess: 'collectData',
      onFailure: 'loginRequired'
    },
    {
      id: 'collectData',
      block: {
        name: 'get-text',
        selector: '.user-data',
        findBy: 'cssSelector',
        option: {}
      }
    },
    {
      id: 'loginRequired',
      block: {
        name: 'navigate',
        url: '/login',
        waitForLoad: true
      }
    }
  ]
};
```

#### 자동 클릭 모드 (CDP Auto-click)

```typescript
const workflow = {
  version: '1.0',
  start: 'autoCheckLogin',
  steps: [
    {
      id: 'autoCheckLogin',
      block: {
        name: 'check-status',
        checkType: 'login',
        title: '로그인 상태 자동 확인',
        description: 'CDP를 통해 자동으로 확인됩니다',
        notification: {
          message: '자동 확인 중... 🤖',
          urgency: 'medium'
        },
        options: {
          autoClick: true,           // CDP 자동 클릭 활성화
          clickDelay: 1000,          // 1초 후 자동 클릭
          fallbackToManual: true,    // 실패 시 수동 모드
          timeoutMs: 30000,
          retryable: false
        }
      },
      next: 'processResult'
    },
    {
      id: 'processResult',
      block: {
        name: 'get-text',
        selector: '.result',
        findBy: 'cssSelector',
        option: {}
      }
    }
  ]
};
```

#### 지원하는 checkType
- `login`: 로그인 상태 확인
- `pageLoad`: 페이지 로딩 완료 확인  
- `element`: 특정 요소 존재 확인
- `custom`: 사용자 정의 확인 로직

#### 실행 플로우
1. 플로팅 알림 버튼 표시
2. 사용자 클릭 OR CDP 자동 클릭
3. Chrome Side Panel 열기
4. 상태 확인 UI 표시
5. 사용자 확인/취소
6. 워크플로우 계속/중단

## 디버깅

### 결과 구조

```typescript
{
  success: boolean;
  steps: [
    {
      stepId: string;
      skipped: boolean;
      success: boolean;
      message?: string;
      result?: any;
      startedAt: string;  // ISO 8601
      finishedAt: string; // ISO 8601
      attempts: number;
    }
  ];
  timestamp: string;
  targetUrl: string;
  error?: string;
}
```

### 콘솔 로그 확인

- **페이지 콘솔**: SDK 메시지
- **확장 콘솔** (chrome://extensions/ → 배경 페이지): WorkflowRunner 로그
- **개발자 도구**: Content script 로그

## 추가 문서

- [CLAUDE.md](CLAUDE.md) - 프로젝트 개요 및 아키텍처
- [BLOCK_EXECUTION_ARCHITECTURE.md](BLOCK_EXECUTION_ARCHITECTURE.md) - 블록 실행 아키텍처
- [README.md](README.md) - 프로젝트 설치 및 실행 (Korean)
