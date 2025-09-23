# 8G Extension 블록 실행 아키텍처 분석

## 개요
8G Extension은 웹페이지에서 데이터를 수집하기 위한 Chrome Extension입니다. 이 문서는 블록 실행을 처음 사용하는 분들을 위한 간단한 사용 안내와 순차 실행의 요점을 제공합니다.

## 현재 아키텍처

### 빠른 시작

1) 클라이언트 생성 및 설치 체크
```html
<script type="module">
  import { EightGClient } from './dist/index.js';
  const client = new EightGClient();
  await client.checkExtension();
  // ...
</script>
```

2) 단일 블록 실행
```ts
await client.collectData({
  targetUrl: location.href,
  block: { name: 'get-text', selector: '#title', findBy: 'cssSelector', option: {} },
});
```

#### npm에서 사용

```bash
npm install 8g-extension
# 또는
yarn add 8g-extension
```

```ts
import { EightGClient } from '8g-extension';

const client = new EightGClient();
await client.checkExtension();

await client.collectData({
  targetUrl: location.href,
  block: { name: 'get-text', selector: '#title', findBy: 'cssSelector', option: {} },
});
```

3) 블록 리스트(순차 실행)
```ts
await client.collectData({
  targetUrl: location.href,
  blockDelay: 300,
  block: [
    { name: 'event-click', selector: '.open', findBy: 'cssSelector', option: { waitForSelector: true } },
    { name: 'get-text', selector: '.modal .content', findBy: 'cssSelector', option: { waitForSelector: true } },
  ],
});
```

### 요약 포인트

– 모든 블록에는 `option: {}`를 권장합니다(비어있어도 OK)
– `blockDelay`로 블록 간 대기 시간을 조절할 수 있습니다(기본 500ms)
– 다중 요소가 필요하면 `option.multiple: true`를 사용하세요

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

## 구현된 BlockList 순차 실행 기능

### 🎯 주요 기능

#### 1. 순차 실행
- 블록들이 배열 순서대로 순차적으로 실행됩니다
- 각 블록 사이에 설정 가능한 지연 시간이 적용됩니다

#### 2. 지연 시간 설정
- `blockDelay` 옵션으로 블록 간 대기 시간을 조정할 수 있습니다
- 기본값: `500ms`
- 범위: `0ms` (대기 없음) ~ 원하는 시간

#### 3. 에러 처리
- 하나의 블록에서 에러가 발생해도 다음 블록은 계속 실행됩니다
- 실패한 블록은 `{ hasError: true, message: "에러 메시지", data: null }` 형태로 결과에 포함됩니다

#### 4. 하위 호환성
- 기존 단일 블록 사용법은 그대로 지원됩니다
- `collectData({ block: Block })` - 단일 블록
- `collectData({ block: Block[] })` - 블록 배열

### 📝 사용 예시

```javascript
// 클릭 후 모달 데이터 수집
await client.collectData({
  targetUrl: 'https://example.com',
  blockDelay: 1000, // 1초 대기
  block: [
    {
      name: 'event-click',
      selector: '.open-modal-btn',
      findBy: 'cssSelector',
      option: { waitForSelector: true }
    },
    {
      name: 'get-text',
      selector: '.modal-content',
      findBy: 'cssSelector',
      option: { waitForSelector: true }
    }
  ]
});

// 빠른 순차 실행
await client.collectData({
  targetUrl: 'https://example.com',
  blockDelay: 0, // 대기 없음
  block: [block1, block2, block3]
});

// 기존 방식 (단일 블록)
await client.collectData({
  targetUrl: 'https://example.com',
  block: {
    name: 'get-text',
    selector: '.title',
    findBy: 'cssSelector'
  }
});
```

## 결론

✅ **BlockList 순차 실행 기능이 성공적으로 구현되었습니다!**

### 🎉 구현 완료 사항
- **타입 정의 확장**: `Block | Block[]` 지원 및 `blockDelay` 옵션 추가
- **SDK 클라이언트 확장**: 오버로드를 통한 단일/배열 블록 지원
- **Background 처리**: 순차 실행 및 설정 가능한 지연 시간 구현
- **메시지 핸들링**: 모든 레이어에서 블록 배열 지원
- **하위 호환성**: 기존 단일 블록 사용법 완전 지원

### 🚀 주요 특징
- **순차 실행**: 블록들이 배열 순서대로 실행
- **지연 시간 설정**: `blockDelay` 옵션으로 블록 간 대기 시간 조정
- **에러 복원력**: 하나의 블록 실패 시에도 다음 블록 계속 실행
- **완전한 하위 호환성**: 기존 코드 수정 없이 사용 가능

### 📋 테스트 방법
1. Python 서버 실행: `python3 -m http.server 8080`
2. 브라우저에서 `http://localhost:8080/test-page.html` 접속
3. 8G Extension 설치 후 각 테스트 시나리오 실행

이제 클릭 후 모달 데이터 수집, 폼 입력 → 제출 → 결과 확인 등 복잡한 워크플로우를 블록 배열로 순차 실행할 수 있습니다!

## 참고
– 고정된 셀렉터로 동작하지 않는 경우가 있습니다. 동적 UI에서는 `waitForSelector`와 충분한 `waitSelectorTimeout`을 사용하세요.
– 클릭 후 DOM 업데이트가 필요한 경우 다음 스텝 앞에 `delayAfterMs`를 넣어 안정성을 높이세요.
