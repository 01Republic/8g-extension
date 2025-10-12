# Blocks Catalog

이 문서는 프로젝트에서 제공하는 블록 목록과 각 블록의 기본 개념, 필드, 사용 예시(JSON 형태)를 정리합니다. 모든 블록은 공통적으로 다음 기본 필드를 가집니다.

- `name` (string): 블록의 고유 이름
- `selector` (string): 타깃 요소를 찾기 위한 셀렉터
- `findBy` ("cssSelector" | "xpath"): 셀렉터 타입
- `option.waitForSelector?` (boolean): 셀렉터 대기 여부
- `option.waitSelectorTimeout?` (number): 대기 타임아웃(ms)
- `option.multiple?` (boolean): 다중 요소 허용 여부

---

- 설치(npm)
  - `npm install 8g-extension` 또는 `yarn add 8g-extension`
- 임포트(ESM)
  - `import { EightGClient } from '8g-extension'`
  - React는 SDK 사용에 필요하지 않습니다.

---

## get-text
DOM 요소의 텍스트를 추출합니다.

- 추가 필드: 
  - `includeTags?` (boolean): true면 innerHTML 기반으로 추출
  - `useTextContent?` (boolean): true면 textContent, 아니면 innerText
  - `regex?` (string): 매칭되는 부분만 추출(전역)
  - `prefixText?` (string): 결과 앞에 붙일 텍스트
  - `suffixText?` (string): 결과 뒤에 붙일 텍스트

예시(단일):
```json
{
  "name": "get-text",
  "selector": "h1.page-title",
  "findBy": "cssSelector",
  "option": { "waitForSelector": true, "waitSelectorTimeout": 5000 },
  "useTextContent": true
}
```

예시(다중 + 정규식):
```json
{
  "name": "get-text",
  "selector": ".card .desc",
  "findBy": "cssSelector",
  "option": { "multiple": true },
  "regex": "#[0-9A-Fa-f]{6}",
  "prefixText": "color:",
  "suffixText": ";"
}
```

---


## attribute-value
요소의 특정 속성 값을 읽습니다.

- 추가 필드:
  - `attributeName` (string): 읽을 속성 이름

예시(단일):
```json
{
  "name": "attribute-value",
  "selector": "img.logo",
  "findBy": "cssSelector",
  "attributeName": "src"
}
```

예시(다중):
```json
{
  "name": "attribute-value",
  "selector": "a.nav-item",
  "findBy": "cssSelector",
  "option": { "multiple": true },
  "attributeName": "href"
}
```

---

## get-value-form
폼 요소의 값을 읽습니다.

- 추가 필드:
  - `type?` ("text-field" | "select" | "checkbox"): 기본값 "text-field"

예시:
```json
{
  "name": "get-value-form",
  "selector": "#email",
  "findBy": "cssSelector",
  "type": "text-field"
}
```

---

## set-value-form
폼 요소의 값을 설정합니다.

- 추가 필드:
  - `setValue` (string): 설정할 값
  - `type?` ("text-field" | "select" | "checkbox"): 기본값 "text-field"

예시(텍스트 필드):
```json
{
  "name": "set-value-form",
  "selector": "#email",
  "findBy": "cssSelector",
  "setValue": "user@example.com",
  "type": "text-field"
}
```

예시(체크박스):
```json
{
  "name": "set-value-form",
  "selector": "#agree",
  "findBy": "cssSelector",
  "setValue": "true",
  "type": "checkbox"
}
```

---

## clear-value-form
폼 요소의 값을 초기화합니다.

- 추가 필드:
  - `type?` ("text-field" | "select" | "checkbox"): 기본값 "text-field"

예시:
```json
{
  "name": "clear-value-form",
  "selector": "#email",
  "findBy": "cssSelector",
  "type": "text-field"
}
```

---

## element-exists
요소 존재 여부를 확인합니다.

예시:
```json
{
  "name": "element-exists",
  "selector": ".toast.success",
  "findBy": "cssSelector",
  "option": { "waitForSelector": true, "waitSelectorTimeout": 3000 }
}
```

---

## event-click
요소를 클릭 이벤트로 시뮬레이션합니다. 다중 매칭 시 텍스트 필터로 대상 선택이 가능합니다.

- 추가 필드:
  - `textFilter?`: { `text`: string | string[], `mode`: "exact" | "contains" | "startsWith" | "endsWith" | "regex" }

예시(첫 번째 요소 클릭):
```json
{
  "name": "event-click",
  "selector": ".btn-primary",
  "findBy": "cssSelector"
}
```

예시(텍스트 필터 사용):
```json
{
  "name": "event-click",
  "selector": "button",
  "findBy": "cssSelector",
  "option": { "multiple": true },
  "textFilter": { "text": ["Submit", "확인"], "mode": "exact" }
}
```

---

## save-assets
페이지 내의 이미지/오디오/비디오 등 에셋 URL을 수집합니다.

예시:
```json
{
  "name": "save-assets",
  "selector": "img, video, audio, source",
  "findBy": "cssSelector"
}
```

---

## get-element-data
요소의 텍스트, 속성, 선택자(CSS/XPath)를 종합적으로 수집합니다.

- 추가 필드:
  - 텍스트 옵션: `includeText?`(기본 true), `includeTags?`, `useTextContent?`, `regex?`, `prefixText?`, `suffixText?`
  - 속성 옵션: `attributes?` (string[])
  - 선택자 생성 옵션: `includeSelector?`, `includeXPath?`

예시(단일 요소):
```json
{
  "name": "get-element-data",
  "selector": ".article .title",
  "findBy": "cssSelector",
  "includeText": true,
  "attributes": ["href", "title"],
  "includeSelector": true,
  "includeXPath": true
}
```

예시(다중 요소):
```json
{
  "name": "get-element-data",
  "selector": ".list .item",
  "findBy": "cssSelector",
  "option": { "multiple": true },
  "includeText": false,
  "attributes": ["data-id"]
}
```

---

## scroll
페이지나 특정 요소로 스크롤합니다. 무한 스크롤 페이지에서 컨텐츠를 로딩할 때 유용합니다.

- 추가 필드:
  - `scrollType?` ("toElement" | "toBottom" | "byDistance" | "untilLoaded"): 스크롤 타입 (기본: "toBottom")
  - `distance?` (number): 스크롤 거리 (px, byDistance/untilLoaded 타입에서 사용, 기본: 500)
  - `behavior?` ("auto" | "smooth"): 스크롤 동작 (기본: "smooth")
  - `maxScrolls?` (number): 최대 스크롤 횟수 (untilLoaded 타입에서 사용, 기본: 50)
  - `waitAfterScroll?` (number): 스크롤 후 대기 시간 (ms, 기본: 300)

예시(특정 요소로 스크롤):
```json
{
  "name": "scroll",
  "selector": ".footer",
  "findBy": "cssSelector",
  "scrollType": "toElement",
  "behavior": "smooth",
  "option": {}
}
```

예시(페이지 맨 아래로 스크롤):
```json
{
  "name": "scroll",
  "scrollType": "toBottom",
  "behavior": "smooth",
  "waitAfterScroll": 500
}
```

예시(거리 기반 스크롤):
```json
{
  "name": "scroll",
  "scrollType": "byDistance",
  "distance": 1000,
  "behavior": "auto"
}
```

예시(무한 스크롤 - 컨텐츠가 더 로딩될 때까지):
```json
{
  "name": "scroll",
  "scrollType": "untilLoaded",
  "distance": 500,
  "maxScrolls": 100,
  "waitAfterScroll": 1000
}
```

---

## keypress
키보드 키 입력을 시뮬레이션합니다. ESC 키로 모달 닫기, Enter로 검색 실행 등에 사용됩니다.

- 주요 필드:
  - `key` (string, 필수): 키 이름 ("Escape", "Enter", "ArrowDown" 등)
  - `code?` (string): 키 코드 (선택, 기본: key와 동일)
  - `keyCode?` (number): 키 코드 번호 (선택, 기본: key에서 자동 계산)
  - `modifiers?` (배열): 수정 키 ["Alt", "Control", "Meta", "Shift"]

- 참고: `selector`, `findBy`, `option` 필드는 사용하지 않습니다.

예시(ESC 키 누르기):
```json
{
  "name": "keypress",
  "key": "Escape"
}
```

예시(Enter 키 누르기):
```json
{
  "name": "keypress",
  "key": "Enter"
}
```

예시(Ctrl+S 단축키):
```json
{
  "name": "keypress",
  "key": "s",
  "modifiers": ["Control"]
}
```

예시(화살표 키):
```json
{
  "name": "keypress",
  "key": "ArrowDown"
}
```

---

## wait
지정된 시간 동안 대기합니다. 페이지 로딩이나 애니메이션 완료를 기다릴 때 유용합니다.

- 주요 필드:
  - `duration` (number, 필수): 대기 시간 (밀리초)

- 참고: `selector`, `findBy`, `option` 필드는 사용하지 않습니다.

예시(1초 대기):
```json
{
  "name": "wait",
  "duration": 1000
}
```

예시(3초 대기):
```json
{
  "name": "wait",
  "duration": 3000
}
```

---

## fetch-api
외부 API를 호출하여 데이터를 가져옵니다. Background에서 실행되므로 CORS 제약 없이 API를 호출할 수 있습니다.

- 주요 필드:
  - `url` (string, 필수): API 엔드포인트 URL
  - `method?` (string): HTTP 메서드 (기본: "GET")
    - 가능한 값: "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"
  - `headers?` (Record<string, string>): 요청 헤더
  - `body?` (any): 요청 바디 (객체 또는 문자열, GET/HEAD에는 사용 불가)
  - `timeout?` (number): 타임아웃 (ms, 기본: 30000)
  - `parseJson?` (boolean): 응답을 JSON으로 파싱 (기본: true)
  - `returnHeaders?` (boolean): 응답 헤더도 반환 (기본: false)

- 참고: `selector`, `findBy`, `option` 필드는 사용하지 않습니다.

예시(GET 요청):
```json
{
  "name": "fetch-api",
  "url": "https://api.example.com/users"
}
```

예시(POST 요청):
```json
{
  "name": "fetch-api",
  "url": "https://api.example.com/users",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "body": {
    "name": "홍길동",
    "email": "hong@example.com"
  }
}
```

예시(응답 헤더 포함):
```json
{
  "name": "fetch-api",
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "X-API-Key": "my-api-key"
  },
  "returnHeaders": true,
  "timeout": 10000
}
```

**워크플로우에서 사용 예시** (이전 스텝 데이터를 API로 전송):
```typescript
{
  version: '1.0',
  start: 'scrapeData',
  steps: [
    {
      id: 'scrapeData',
      block: {
        name: 'get-text',
        selector: '.product-title',
        findBy: 'cssSelector',
        option: {}
      },
      next: 'sendToApi'
    },
    {
      id: 'sendToApi',
      block: {
        name: 'fetch-api',
        url: 'https://api.example.com/products',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          title: { valueFrom: '$.steps.scrapeData.result.data' }, // 이전 스텝 결과 바인딩
          source: 'web-scraping',
          timestamp: new Date().toISOString()
        }
      }
    }
  ]
}
```

**반환 데이터 구조**:
```typescript
{
  status: number;         // HTTP 상태 코드 (예: 200, 404)
  statusText: string;     // 상태 텍스트 (예: "OK", "Not Found")
  data: any;              // 파싱된 JSON 또는 텍스트
  headers?: Record<string, string>;  // returnHeaders: true일 때만
}
```

---

## ai-parse-data
AI(OpenAI)를 사용하여 비구조화된 데이터를 구조화된 JSON으로 파싱합니다. 웹페이지의 복잡한 데이터를 추출할 때 유용합니다.

- 주요 필드:
  - `apiKey` (string, 필수): OpenAI API 키
  - `schemaDefinition` (SchemaDefinition, 필수): 출력 데이터 스키마 정의
  - `sourceData?` (any): 파싱할 원본 데이터 (워크플로우에서는 이전 스텝 결과 바인딩 가능)
  - `prompt?` (string): AI에게 추가 지시사항
  - `model?` (string): 사용할 OpenAI 모델 (기본: "gpt-4o-mini")

- 참고: `selector`, `findBy`, `option` 필드는 사용하지 않습니다.

**스키마 정의 방법**:

객체 스키마:
```typescript
{
  type: 'object',
  shape: {
    fieldName: { type: 'string', description: '설명', optional: false },
    age: { type: 'number', description: '나이' },
    active: { type: 'boolean' }
  }
}
```

배열 스키마:
```typescript
{
  type: 'array',
  items: { 
    type: 'object',
    shape: { ... }
  }
}
```

예시(객체 파싱):
```json
{
  "name": "ai-parse-data",
  "apiKey": "sk-...",
  "sourceData": "이름: 홍길동, 나이: 30세, 직업: 개발자",
  "schemaDefinition": {
    "type": "object",
    "shape": {
      "name": { "type": "string", "description": "사람의 이름" },
      "age": { "type": "number", "description": "나이" },
      "occupation": { "type": "string", "description": "직업" }
    }
  },
  "prompt": "주어진 텍스트에서 사람 정보를 추출하세요."
}
```

예시(배열 파싱):
```json
{
  "name": "ai-parse-data",
  "apiKey": "sk-...",
  "sourceData": ["상품1: 10,000원", "상품2: 20,000원"],
  "schemaDefinition": {
    "type": "array",
    "items": {
      "type": "object",
      "shape": {
        "name": { "type": "string" },
        "price": { "type": "number" }
      }
    }
  }
}
```

**워크플로우에서 사용 예시**:
```typescript
{
  id: 'parseProducts',
  block: {
    name: 'ai-parse-data',
    apiKey: process.env.OPENAI_API_KEY,
    sourceData: { valueFrom: '$.steps.getProducts.result.data' }, // 이전 스텝 결과 바인딩
    schemaDefinition: {
      type: 'array',
      items: {
        type: 'object',
        shape: {
          productName: { type: 'string', description: '상품명' },
          price: { type: 'number', description: '가격' },
          inStock: { type: 'boolean', description: '재고 여부' }
        }
      }
    }
  }
}
```
