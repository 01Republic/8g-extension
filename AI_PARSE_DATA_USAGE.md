# AI Parse Data Block 사용 가이드

## 개요

`ai-parse-data` 블록은 수집한 데이터를 AI(OpenAI)를 사용하여 구조화된 형식으로 파싱합니다.

## 주요 특징

- **JSON 스키마 기반**: 원하는 데이터 구조를 JSON 스키마로 정의
- **LangChain + OpenAI**: Background Script에서 안전하게 실행
- **유연한 파싱**: HTML 테이블, 텍스트, JSON 등 다양한 형식 지원

## 기본 사용법

### 1. 간단한 예제 (테이블 데이터 파싱)

```typescript
import { EightGClient, createSchema, Schema } from '8g-extension';

const client = new EightGClient();

// 1. 먼저 HTML 테이블 수집
const tableHtml = await client.collectData({
  targetUrl: 'https://example.com/members',
  block: {
    name: 'get-text',
    selector: 'table.members',
    findBy: 'cssSelector',
    includeTags: true, // HTML 포함
    option: { waitForSelector: true }
  }
});

// 2. AI로 구조화된 데이터로 파싱
const result = await client.collectData({
  targetUrl: 'https://example.com/members',
  block: {
    name: 'ai-parse-data',
    sourceData: tableHtml.result.data, // 이전에 수집한 데이터
    schemaDefinition: createSchema({
      memberName: Schema.string(),
      email: Schema.string(),
      joinDate: Schema.string(),
      status: Schema.string(true) // optional
    }),
    apiKey: 'sk-...' // OpenAI API 키
  }
});

// 결과:
// {
//   memberName: "홍길동",
//   email: "hong@example.com", 
//   joinDate: "2024-01-15",
//   status: "active"
// }
```

### 2. 배열 데이터 파싱

```typescript
// 여러 멤버 정보를 배열로 파싱
const result = await client.collectData({
  targetUrl: 'https://example.com/members',
  block: {
    name: 'ai-parse-data',
    sourceData: tableHtml.result.data,
    schemaDefinition: {
      type: 'object',
      shape: {
        members: {
          type: 'array',
          items: {
            type: 'object',
            shape: {
              memberName: { type: 'string' },
              email: { type: 'string' },
              joinDate: { type: 'string' }
            }
          }
        }
      }
    },
    apiKey: 'sk-...'
  }
});

// 결과:
// {
//   members: [
//     { memberName: "홍길동", email: "hong@example.com", joinDate: "2024-01-15" },
//     { memberName: "김철수", email: "kim@example.com", joinDate: "2024-02-20" },
//     ...
//   ]
// }
```

### 3. 커스텀 프롬프트 사용

```typescript
const result = await client.collectData({
  targetUrl: 'https://example.com',
  block: {
    name: 'ai-parse-data',
    sourceData: rawText,
    schemaDefinition: createSchema({
      productName: Schema.string(),
      price: Schema.number(),
      currency: Schema.string()
    }),
    prompt: '가격 정보에서 숫자만 추출하고, 통화 기호는 currency 필드에 별도로 저장해주세요.',
    apiKey: 'sk-...'
  }
});
```

## 스키마 정의 방법

### 방법 1: Schema 헬퍼 사용 (권장)

```typescript
import { createSchema, Schema } from '8g-extension';

const schema = createSchema({
  name: Schema.string(),
  age: Schema.number(),
  isActive: Schema.boolean(),
  tags: Schema.array(Schema.string()),
  address: Schema.object({
    street: Schema.string(),
    city: Schema.string()
  }),
  nickname: Schema.string(true) // optional
});
```

### 방법 2: 직접 JSON 객체로 정의

```typescript
const schema = {
  type: 'object',
  shape: {
    name: { type: 'string' },
    age: { type: 'number' },
    isActive: { type: 'boolean' },
    tags: { 
      type: 'array', 
      items: { type: 'string' } 
    },
    address: {
      type: 'object',
      shape: {
        street: { type: 'string' },
        city: { type: 'string' }
      }
    },
    nickname: { type: 'string', optional: true }
  }
};
```

## 워크플로우에서 사용

```typescript
const workflow = {
  version: '1.0',
  start: 'collectTable',
  steps: [
    {
      id: 'collectTable',
      block: {
        name: 'get-text',
        selector: 'table.members',
        findBy: 'cssSelector',
        includeTags: true,
        option: { waitForSelector: true }
      },
      next: 'parseData'
    },
    {
      id: 'parseData',
      block: {
        name: 'ai-parse-data',
        sourceData: { valueFrom: '$.steps.collectTable.result.data' },
        schemaDefinition: createSchema({
          memberName: Schema.string(),
          email: Schema.string(),
          joinDate: Schema.string()
        }),
        apiKey: 'sk-...'
      }
    }
  ]
};

const result = await client.collectWorkflow({
  targetUrl: 'https://example.com/members',
  workflow
});

// result.result.steps[1].result.data에 파싱된 데이터
```

## 파라미터 설명

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sourceData` | any | ✅ | 파싱할 원본 데이터 |
| `schemaDefinition` | SchemaDefinition | ✅ | 출력 데이터 구조 정의 |
| `apiKey` | string | ✅ | OpenAI API 키 |
| `prompt` | string | ❌ | AI에게 추가 지시사항 |
| `model` | string | ❌ | OpenAI 모델 (기본: gpt-4o-mini) |

## 지원하는 데이터 타입

- `string`: 문자열
- `number`: 숫자
- `boolean`: 불리언
- `array`: 배열 (items 필드로 요소 타입 정의)
- `object`: 객체 (shape 필드로 구조 정의)

모든 타입에 `optional: true`를 추가하면 선택적 필드가 됩니다.

## 모델 선택

```typescript
// 기본 모델 (gpt-4o-mini) - 빠르고 저렴
block: {
  name: 'ai-parse-data',
  ...
}

// 고급 모델 (gpt-4o) - 더 정확하지만 비쌈
block: {
  name: 'ai-parse-data',
  model: 'gpt-4o',
  ...
}

// 기타 모델
block: {
  name: 'ai-parse-data',
  model: 'gpt-4-turbo',
  ...
}
```

## 주의사항

1. **API 키 보안**: API 키는 코드에 직접 노출되지 않도록 환경 변수나 안전한 저장소에 보관하세요.
2. **비용**: OpenAI API 사용량에 따라 비용이 발생합니다.
3. **데이터 크기**: 너무 큰 데이터는 토큰 제한에 걸릴 수 있습니다.
4. **정확도**: AI 파싱은 100% 정확하지 않을 수 있으므로, 중요한 데이터는 검증이 필요합니다.

## 에러 처리

```typescript
const result = await client.collectData({
  targetUrl: 'https://example.com',
  block: {
    name: 'ai-parse-data',
    // ...
  }
});

if (result.result.hasError) {
  console.error('AI 파싱 실패:', result.result.message);
} else {
  console.log('파싱 성공:', result.result.data);
}
```

## 실전 예제

### 1. 전자상거래 상품 정보 추출

```typescript
const productSchema = createSchema({
  name: Schema.string(),
  price: Schema.number(),
  originalPrice: Schema.number(true),
  discount: Schema.number(true),
  rating: Schema.number(true),
  reviewCount: Schema.number(true),
  inStock: Schema.boolean(),
  seller: Schema.string(true),
  specifications: Schema.array(Schema.object({
    key: Schema.string(),
    value: Schema.string()
  }))
});
```

### 2. 뉴스 기사 구조화

```typescript
const articleSchema = createSchema({
  title: Schema.string(),
  author: Schema.string(true),
  publishDate: Schema.string(),
  category: Schema.string(true),
  tags: Schema.array(Schema.string()),
  summary: Schema.string(),
  mainImage: Schema.string(true)
});
```

### 3. 채용 공고 정보

```typescript
const jobSchema = createSchema({
  title: Schema.string(),
  company: Schema.string(),
  location: Schema.string(),
  salary: Schema.object({
    min: Schema.number(true),
    max: Schema.number(true),
    currency: Schema.string()
  }),
  requirements: Schema.array(Schema.string()),
  benefits: Schema.array(Schema.string()),
  deadline: Schema.string(true)
});
```

