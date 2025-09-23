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
