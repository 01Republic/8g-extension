# 8G Extension 블록 실행 아키텍처

## 개요
8G Extension은 웹페이지에서 데이터를 수집하고 자동화하기 위한 Chrome Extension입니다. 

**중요**: 모든 블록 실행은 **워크플로우를 통해서만** 가능합니다. 단일 블록도 워크플로우로 실행해야 합니다.

## 현재 아키텍처

### 빠른 시작

#### 설치

```bash
npm install 8g-extension
# 또는
yarn add 8g-extension
```

#### 기본 사용법

```ts
import { EightGClient } from '8g-extension';

const client = new EightGClient();
await client.checkExtension();
```

### 블록 실행 방법

모든 블록은 **워크플로우를 통해서만** 실행됩니다.

#### 1) 단일 블록 실행

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
        option: {} 
      }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow
});
```

#### 2) 여러 블록 순차 실행

```ts
const workflow = {
  version: '1.0',
  start: 'clickOpen',
  steps: [
    {
      id: 'clickOpen',
      block: { 
        name: 'event-click', 
        selector: '.open', 
        findBy: 'cssSelector', 
        option: { waitForSelector: true } 
      },
      delayAfterMs: 300,  // 다음 블록 전 300ms 대기
      next: 'getContent'
    },
    {
      id: 'getContent',
      block: { 
        name: 'get-text', 
        selector: '.modal .content', 
        findBy: 'cssSelector', 
        option: { waitForSelector: true } 
      }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow
});
```

#### 3) 고급 블록 사용 예시

```ts
// 무한 스크롤 + 키보드 입력 + 대기
const workflow = {
  version: '1.0',
  start: 'scrollToLoad',
  steps: [
    {
      id: 'scrollToLoad',
      block: { 
        name: 'scroll',
        scrollType: 'untilLoaded',
        distance: 500,
        maxScrolls: 50
      },
      next: 'waitAnimation'
    },
    {
      id: 'waitAnimation',
      block: { name: 'wait', duration: 500 },
      next: 'clickModal'
    },
    {
      id: 'clickModal',
      block: { 
        name: 'event-click', 
        selector: '.open-modal', 
        findBy: 'cssSelector', 
        option: {} 
      },
      next: 'closeWithEsc'
    },
    {
      id: 'closeWithEsc',
      block: { name: 'keypress', key: 'Escape' }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: location.href,
  workflow
});
```

#### 4) AI 파싱 블록

```ts
const workflow = {
  version: '1.0',
  start: 'getText',
  steps: [
    {
      id: 'getText',
      block: {
        name: 'get-text',
        selector: '.product-info',
        findBy: 'cssSelector',
        option: {}
      },
      next: 'parseWithAi'
    },
    {
      id: 'parseWithAi',
      block: {
        name: 'ai-parse-data',
        apiKey: 'sk-...',
        sourceData: { valueFrom: '$.steps.getText.result.data' }, // 이전 스텝 결과 바인딩
        schemaDefinition: {
          type: 'object',
          shape: {
            name: { type: 'string', description: '상품명' },
            price: { type: 'number', description: '가격' }
          }
        }
      }
    }
  ]
};
```

### 요약 포인트

– **모든 블록은 워크플로우로만 실행됩니다** (`collectWorkflow` 사용)
– 모든 블록에는 `option: {}`를 권장합니다 (비어있어도 OK)
– 예외: `keypress`, `wait`, `ai-parse-data` 블록은 `selector`, `findBy`, `option` 필드 불필요
– 블록 간 대기: `delayAfterMs`를 각 스텝에 지정 (ms)
– 다중 요소가 필요하면 `option.multiple: true`를 사용하세요
– 스텝 간 데이터 전달: `valueFrom`, `template` 바인딩 사용

### 지원 블록 (요약)

– `get-text`: 텍스트 추출
– `attribute-value`: 속성 값 추출
– `get-value-form`: 폼 값 가져오기
– `set-value-form`: 폼 값 설정
– `clear-value-form`: 폼 값 지우기
– `element-exists`: 요소 존재 확인
– `event-click`: 클릭 이벤트 발생
– `save-assets`: 에셋 저장
– `get-element-data`: 요소 데이터 추출
– `scroll`: 페이지 스크롤 (toElement, toBottom, byDistance, untilLoaded)
– `keypress`: 키보드 입력 시뮬레이션
– `wait`: 지정 시간 대기
– `fetch-api`: 외부 API 호출 (CORS 제약 없음)
– `ai-parse-data`: AI 기반 데이터 파싱 (OpenAI)

## 워크플로우 기반 실행

### 🎯 주요 특징

#### 1. 워크플로우 전용
- 모든 블록은 워크플로우를 통해서만 실행됩니다
- 단일 블록도 워크플로우로 래핑해야 합니다
- `collectWorkflow()` 메서드만 제공됩니다

#### 2. 순차 실행
- `steps` 배열의 순서대로 실행됩니다
- `next` 필드로 다음 스텝을 지정합니다
- `delayAfterMs`로 스텝 간 대기 시간을 조정합니다

#### 3. 고급 기능
- **분기 처리**: `switch`, `onSuccess/onFailure` 지원
- **조건부 실행**: `when` 조건으로 스텝 스킵 가능
- **재시도**: `retry { attempts, delayMs, backoffFactor }`
- **타임아웃**: `timeoutMs`로 스텝별 제한 시간 설정
- **데이터 바인딩**: `valueFrom`, `template`로 이전 스텝 결과 전달

#### 4. 에러 처리
- 각 스텝의 성공/실패 여부를 기록합니다
- `onFailure`로 실패 시 다른 스텝으로 이동 가능
- 재시도 설정으로 안정성 향상

### 📝 결과 구조

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
      startedAt: string;
      finishedAt: string;
      attempts: number;
    }
  ];
  timestamp: string;
  targetUrl: string;
}
```

## 아키텍처 변경 사항

### ✅ 워크플로우 중심으로 통합

**Before (v1.x)**:
- ❌ `collectData()` - 단일/배열 블록 직접 실행
- ❌ `blockDelay` - 블록 간 지연 시간

**After (v2.x+)**:
- ✅ `collectWorkflow()` - 워크플로우 전용
- ✅ `delayAfterMs` - 스텝별 지연 시간
- ✅ 분기, 조건, 재시도, 바인딩 등 강력한 기능

### 🎯 장점

1. **일관성**: 모든 블록 실행이 동일한 방식
2. **강력함**: 복잡한 자동화 시나리오 구현 가능
3. **안정성**: 재시도, 타임아웃, 조건부 실행 지원
4. **유연성**: 스텝 간 데이터 전달, 분기 처리
5. **디버깅**: 각 스텝별 상세한 실행 로그

### 🔧 Background 서비스 리팩토링

- `BackgroundManager`: 메시지 라우팅만 담당
- `WorkflowService`: 워크플로우 실행 전담
- `CdpService`: Chrome DevTools Protocol 처리
- `AiParsingService`: AI 파싱 전담

### 📋 마이그레이션 가이드

기존 코드를 워크플로우로 변환하는 방법은 `WORKFLOW_EXECUTION_ARCHITECTURE.md`를 참고하세요.

## 참고
– 고정된 셀렉터로 동작하지 않는 경우가 있습니다. 동적 UI에서는 `waitForSelector`와 충분한 `waitSelectorTimeout`을 사용하세요.
– 클릭 후 DOM 업데이트가 필요한 경우 다음 스텝 앞에 `delayAfterMs`를 넣어 안정성을 높이세요.
