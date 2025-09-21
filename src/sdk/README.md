# 8G Extension SDK

웹페이지에서 8G Extension과 쉽게 통신할 수 있는 JavaScript/TypeScript SDK입니다.

## 설치

```bash
# NPM (향후)
npm install 8g-extension-sdk

# 또는 직접 파일 포함
<script src="8g-extension-sdk.js"></script>
```

## 기본 사용법

### 1. 클라이언트 생성

```typescript
import { EightGClient } from '8g-extension-sdk';

const client = new EightGClient();
```

### 2. Extension 상태 확인

```typescript
const extensionInfo = await client.checkExtension();
console.log('Extension 설치됨:', extensionInfo.installed);
console.log('Extension 버전:', extensionInfo.version);
```

### 3. 데이터 수집

```typescript
try {
  const result = await client.collectData({
    targetUrl: 'https://example.com',
    block: {
      name: 'get-text',
      selector: 'h1',
      findBy: 'cssSelector',
      option: {
        waitForSelector: true,
        waitSelectorTimeout: 5000,
        multiple: false,
      },
    },
  });

  if (result.success) {
    console.log('수집된 데이터:', result.data);
  } else {
    console.error('수집 실패:', result.error);
  }
} catch (error) {
  console.error('요청 실패:', error.message);
}
```

### 4. 에러 처리

```typescript
try {
  const result = await client.collectData(request);
  console.log('수집 완료:', result.data);
} catch (error) {
  console.error('수집 실패:', error.message);
}
```

## API 레퍼런스

### EightGClient

#### Constructor

```typescript
new EightGClient();
```

#### Methods

##### `checkExtension(): Promise<ExtensionResponseMessage>`

Extension 설치 여부와 버전 정보를 확인합니다.

**반환값**

- `installed: boolean` - Extension 설치 여부
- `version: string` - Extension 버전

##### `collectData(request: CollectDataRequest): Promise<CollectDataResult>`

지정된 URL에서 데이터를 수집합니다.

**CollectDataRequest**

- `targetUrl: string` - 수집할 페이지 URL
- `block: Block` - 실행할 블록 정의

**CollectDataResult**

- `success: boolean` - 성공 여부
- `data?: any` - 수집된 데이터 (성공 시)
- `error?: string` - 에러 메시지 (실패 시)
- `timestamp: string` - 수집 시간
- `targetUrl: string` - 대상 URL

### 지원하는 Block 타입

#### get-text

텍스트 추출

```typescript
{
  name: 'get-text',
  selector: 'h1',          // CSS 셀렉터 또는 XPath
  findBy: 'cssSelector',   // 'cssSelector' | 'xpath'
  option: {
    waitForSelector: true,    // 요소 대기 여부
    waitSelectorTimeout: 5000, // 대기 시간(ms)
    multiple: false          // 여러 요소 선택 여부
  }
}
```

#### attribute-value

속성 값 추출

```typescript
{
  name: 'attribute-value',
  selector: 'img',         // CSS 셀렉터 또는 XPath
  findBy: 'cssSelector',   // 'cssSelector' | 'xpath'
  option: {
    waitForSelector: true,
    multiple: true
  }
}
```

#### element-exists

요소 존재 여부 확인

```typescript
{
  name: 'element-exists',
  selector: '.popup',      // CSS 셀렉터 또는 XPath
  findBy: 'cssSelector',   // 'cssSelector' | 'xpath'
  option: {
    waitForSelector: true
  }
}
```

## 에러 처리

```typescript
import { EightGError } from '8g-extension-sdk';

try {
  const result = await client.collectData(request);
} catch (error) {
  if (error instanceof EightGError) {
    switch (error.code) {
      case 'EXTENSION_NOT_FOUND':
        console.error('Extension이 설치되지 않음');
        break;
      case 'TIMEOUT':
        console.error('요청 시간 초과');
        break;
      case 'COLLECTION_FAILED':
        console.error('데이터 수집 실패:', error.message);
        break;
      case 'INVALID_REQUEST':
        console.error('잘못된 요청:', error.message);
        break;
    }
  }
}
```

## 예제

### 기본 예제

[basic-usage.ts](./examples/basic-usage.ts) 참조

### 고급 예제

[advanced-usage.ts](./examples/advanced-usage.ts) 참조

## 브라우저 지원

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## 라이선스

MIT License
