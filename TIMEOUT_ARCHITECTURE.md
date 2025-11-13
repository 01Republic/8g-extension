# 타임아웃 아키텍처 문서

이 문서는 8G Extension 프로젝트에서 사용되는 모든 타임아웃 관련 로직을 정리한 것입니다.

## 목차

1. [워크플로우 스텝 실행 타임아웃](#1-워크플로우-스텝-실행-타임아웃)
2. [SDK 클라이언트 타임아웃](#2-sdk-클라이언트-타임아웃)
3. [API 요청 타임아웃](#3-api-요청-타임아웃)
4. [블록별 타임아웃](#4-블록별-타임아웃)
5. [요소 선택자 타임아웃](#5-요소-선택자-타임아웃)
6. [탭 관리 타임아웃](#6-탭-관리-타임아웃)
7. [타임아웃 에러 처리](#7-타임아웃-에러-처리)
8. [타임아웃 기본값 요약](#8-타임아웃-기본값-요약)

---

## 1. 워크플로우 스텝 실행 타임아웃

### 위치
`src/workflow/step-executor/single-executor.ts`

### 구현

```typescript
const runWithTimeout = async <T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> => {
  if (!timeoutMs || timeoutMs <= 0) return fn();
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Step timeout')), timeoutMs);
    fn()
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
};
```

### 설명
- 각 워크플로우 스텝 실행에 타임아웃을 적용하는 유틸리티 함수
- `executeSingleStep` 함수에서 `timeoutMs` 옵션을 통해 전달됨
- 타임아웃이 발생하면 `'Step timeout'` 에러를 throw
- 성공/실패 시 `clearTimeout`으로 타이머 정리

### 사용 예시
```typescript
result = await runWithTimeout(
  () => executeBlock(boundBlock as any, tabId),
  options.timeoutMs
);
```

---

## 2. SDK 클라이언트 타임아웃

### 위치
`src/sdk/EightGClient.ts`

### 2.1 Extension 확인 타임아웃

#### 구현
```typescript
async checkExtension(): Promise<ExtensionResponseMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(EightGError.extensionNotInstalled());
    }, 5000);

    const handleResponse = (event: MessageEvent) => {
      if (isExtensionResponseMessage(event.data)) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        resolve(event.data);
      }
    };

    window.addEventListener('message', handleResponse);
    window.postMessage({ type: '8G_EXTENSION_CHECK' }, '*');
  });
}
```

#### 설명
- Extension 설치 여부 확인 시 사용
- **고정 타임아웃: 5초**
- 타임아웃 시 `EXTENSION_NOT_FOUND` 에러 발생

### 2.2 워크플로우 실행 타임아웃

#### 구현
```typescript
async collectWorkflow(request: CollectWorkflowRequest): Promise<CollectWorkflowResult> {
  return new Promise((resolve, reject) => {
    const requestId = `8g_wf_${Date.now()}_${Math.random()}`;
    const timeoutMs = request.timeoutMs ?? 600000; // 기본 10분
    const timeout = setTimeout(() => {
      reject(EightGError.requestTimeout(timeoutMs));
    }, timeoutMs);

    const handleResponse = (event: MessageEvent) => {
      if (event.data?.type === '8G_COLLECT_RESPONSE' && event.data.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener('message', handleResponse);
        // ... 응답 처리
        resolve({...});
      }
    };

    window.addEventListener('message', handleResponse);
    window.postMessage({...}, '*');
  });
}
```

#### 설명
- 워크플로우 실행 요청 시 사용
- **기본 타임아웃: 10분 (600000ms)**
- `request.timeoutMs`로 커스터마이징 가능
- 타임아웃 시 `REQUEST_TIMEOUT` 에러 발생

---

## 3. API 요청 타임아웃

### 위치
`src/background/service/ApiService.ts`

### 구현
```typescript
async fetchData(request: ApiRequest): Promise<ApiResponse> {
  const { url, method, headers, body, timeout, parseJson, returnHeaders } = request;

  // AbortController로 타임아웃 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    // ... body 처리 ...

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // ... 응답 처리 ...

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}
```

### 설명
- HTTP API 요청 시 타임아웃 처리
- `AbortController`를 사용하여 fetch 요청 중단
- 타임아웃 값은 요청 시 지정됨
- 타임아웃 발생 시 `AbortError`를 catch하여 명확한 에러 메시지 제공

---

## 4. 블록별 타임아웃

### 4.1 WaitForConditionBlock

#### 위치
`src/blocks/WaitForConditionBlock.ts`

#### 구현
```typescript
const timeoutId = setTimeout(() => {
  resolveWith({
    success: false,
    reason: 'timeout',
    message: `Timeout after ${timeoutMs}ms`,
  });
}, timeoutMs);
```

#### 설명
- 조건 대기 블록의 최대 대기 시간
- **기본값: 300000ms (5분)**
- `timeoutMs` 옵션으로 설정 가능 (최소 1000ms)
- 타임아웃 시 `reason: 'timeout'`과 함께 실패 반환

### 4.2 NavigateBlock

#### 위치
`src/blocks/NavigateBlock.ts`

#### 구현
```typescript
const { url, waitForLoad = true, timeout = 30000 } = data;

if (waitForLoad) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Navigation timeout after ${timeout}ms`));
    }, timeout);

    const handleLoad = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('load', handleLoad);
      resolve({ data: true });
    };

    window.addEventListener('load', handleLoad);
    window.location.href = url;
  });
}
```

#### 설명
- 페이지 네비게이션 시 로드 완료 대기 타임아웃
- **기본값: 30000ms (30초)**
- `timeout` 옵션으로 설정 가능
- `waitForLoad`가 `false`면 타임아웃 적용 안 됨

### 4.3 FetchApiBlock

#### 위치
`src/blocks/FetchApiBlock.ts`

#### 구현
```typescript
const response = await chrome.runtime.sendMessage({
  type: 'FETCH_API',
  data: {
    url: data.url,
    method: data.method || 'GET',
    headers: data.headers || {},
    body: data.body,
    timeout: data.timeout || 30000,
    // ...
  },
});
```

#### 설명
- API 요청 블록의 타임아웃 설정
- **기본값: 30000ms (30초)**
- `timeout` 옵션으로 설정 가능
- 실제 타임아웃 처리는 `ApiService`에서 수행

### 4.4 NetworkCatchBlock

#### 위치
`src/blocks/NetworkCatchBlock.ts`

#### 구현
```typescript
const response = await chrome.runtime.sendMessage({
  type: 'NETWORK_CATCH',
  data: {
    // ...
    waitForRequest: data.waitForRequest || false,
    waitTimeout: data.waitTimeout || 5000,
    // ...
  },
});
```

#### 설명
- 네트워크 요청 캐치 블록의 대기 타임아웃
- **기본값: 5000ms (5초)**
- `waitTimeout` 옵션으로 설정 가능
- `waitForRequest`가 `true`일 때만 적용

---

## 5. 요소 선택자 타임아웃

### 위치
- `src/content/elements/finders/ElementSelector.ts`
- `src/content/elements/index.ts`

### 구현

#### ElementSelector.ts
```typescript
public async waitForElement(
  data: SelectorData,
  documentCtx: Document,
  timeout: number
): Promise<Element | Element[] | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = async () => {
      const element = await this.find(data, documentCtx);

      if (element && (Array.isArray(element) ? element.length > 0 : true)) {
        resolve(element);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        resolve(null);
        return;
      }

      setTimeout(checkElement, 100);
    };

    checkElement();
  });
}
```

#### index.ts
```typescript
const { waitForSelector = false, waitSelectorTimeout = 5000 } = option || {};

if (waitForSelector) {
  return selectorInstance.waitForElement(data, documentCtx, waitSelectorTimeout);
}
```

### 설명
- 요소 선택 시 대기 타임아웃
- **기본값: 5000ms (5초)**
- `waitSelectorTimeout` 옵션으로 설정 가능
- `waitForSelector`가 `true`일 때만 적용
- 100ms 간격으로 폴링하여 요소 존재 여부 확인
- 타임아웃 시 `null` 반환 (에러 throw 안 함)

---

## 6. 탭 관리 타임아웃

### 위치
`src/background/chrome/TabManager.ts`

### 구현
```typescript
async waitForTabLoad(tabId: number, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, timeout);

    const listener = (updatedTabId: number, changeInfo: any) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}
```

### 설명
- 탭 로드 완료 대기 타임아웃
- **기본값: 30000ms (30초)**
- `timeout` 파라미터로 설정 가능
- Chrome Tabs API의 `onUpdated` 이벤트를 사용하여 로드 상태 감지
- 타임아웃 시 `'Tab load timeout'` 에러 발생

---

## 7. 타임아웃 에러 처리

### 위치
`src/sdk/errors.ts`

### 구현
```typescript
static requestTimeout(timeoutMs: number = 600000) {
  const seconds = Math.floor(timeoutMs / 1000);
  return new EightGError(
    `Request timeout - Extension did not respond within ${seconds} seconds`,
    'REQUEST_TIMEOUT'
  );
}
```

### 설명
- 타임아웃 발생 시 사용되는 에러 생성 메서드
- 밀리초를 초 단위로 변환하여 사용자 친화적인 메시지 제공
- 에러 코드: `REQUEST_TIMEOUT`
- 기본 타임아웃 값: 600000ms (10분)

---

## 8. 타임아웃 기본값 요약

| 위치 | 타임아웃 종류 | 기본값 | 설정 가능 여부 |
|------|--------------|--------|----------------|
| SDK `checkExtension` | Extension 확인 | 5초 (고정) | ❌ |
| SDK `collectWorkflow` | 워크플로우 실행 | 10분 (600000ms) | ✅ (`request.timeoutMs`) |
| Step 실행 | 각 스텝 실행 | 설정값에 따라 | ✅ (`step.timeoutMs`) |
| API 요청 | HTTP 요청 | 요청 시 지정 | ✅ (`request.timeout`) |
| WaitForConditionBlock | 조건 대기 | 5분 (300000ms) | ✅ (`timeoutMs`) |
| NavigateBlock | 페이지 로드 | 30초 (30000ms) | ✅ (`timeout`) |
| FetchApiBlock | API 요청 | 30초 (30000ms) | ✅ (`timeout`) |
| NetworkCatchBlock | 네트워크 대기 | 5초 (5000ms) | ✅ (`waitTimeout`) |
| ElementSelector | 요소 선택 대기 | 5초 (5000ms) | ✅ (`waitSelectorTimeout`) |
| TabManager | 탭 로드 | 30초 (30000ms) | ✅ (`timeout` 파라미터) |

---

## 구현 패턴

### 1. setTimeout/clearTimeout 패턴
대부분의 타임아웃은 `setTimeout`과 `clearTimeout`을 사용하여 구현됩니다.

```typescript
const timeoutId = setTimeout(() => {
  reject(new Error('Timeout'));
}, timeoutMs);

// 성공 시
clearTimeout(timeoutId);
resolve(result);
```

### 2. AbortController 패턴
HTTP 요청의 경우 `AbortController`를 사용하여 더 정확한 중단이 가능합니다.

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

const response = await fetch(url, {
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

### 3. 폴링 패턴
요소 선택자와 같은 경우 주기적으로 체크하는 폴링 방식을 사용합니다.

```typescript
const checkElement = async () => {
  const element = await this.find(data, documentCtx);
  
  if (element) {
    resolve(element);
    return;
  }
  
  if (Date.now() - startTime >= timeout) {
    resolve(null);
    return;
  }
  
  setTimeout(checkElement, 100);
};
```

---

## 주의사항

1. **타임아웃 정리**: 모든 타임아웃은 성공/실패 시 반드시 `clearTimeout`으로 정리해야 합니다.
2. **에러 처리**: 타임아웃 발생 시 명확한 에러 메시지를 제공해야 합니다.
3. **기본값 설정**: 사용자가 타임아웃을 지정하지 않은 경우 적절한 기본값을 제공해야 합니다.
4. **타임아웃 단위**: 모든 타임아웃은 밀리초(ms) 단위로 지정됩니다.

---

## 관련 파일 목록

- `src/workflow/step-executor/single-executor.ts` - 스텝 실행 타임아웃
- `src/sdk/EightGClient.ts` - SDK 클라이언트 타임아웃
- `src/sdk/errors.ts` - 타임아웃 에러 처리
- `src/background/service/ApiService.ts` - API 요청 타임아웃
- `src/blocks/WaitForConditionBlock.ts` - 조건 대기 타임아웃
- `src/blocks/NavigateBlock.ts` - 네비게이션 타임아웃
- `src/blocks/FetchApiBlock.ts` - API 블록 타임아웃
- `src/blocks/NetworkCatchBlock.ts` - 네트워크 캐치 타임아웃
- `src/content/elements/finders/ElementSelector.ts` - 요소 선택 타임아웃
- `src/content/elements/index.ts` - 요소 선택 옵션
- `src/background/chrome/TabManager.ts` - 탭 로드 타임아웃
- `src/types/internal-messages.ts` - 타임아웃 관련 타입 정의
- `src/sdk/types.ts` - SDK 타임아웃 타입 정의

