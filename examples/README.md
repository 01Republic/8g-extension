# Notion Workspace Data Extraction Workflow

Playwright MCP를 사용해 Notion API를 분석하고, 워크스페이스 데이터를 수집하여 AI로 파싱하는 워크플로우입니다.

## 📋 개요

이 워크플로우는 다음을 수행합니다:

1. **Notion API 탐색**: Playwright MCP로 Notion 사이트 탐색 및 네트워크 요청 분석
2. **데이터 수집**: 워크스페이스, 멤버, 빌링 정보 수집을 위한 API 호출
3. **AI 파싱**: OpenAI를 사용하여 수집된 데이터를 구조화된 JSON으로 변환
4. **분석 결과**: 워크스페이스 현황을 한눈에 파악할 수 있는 리포트 생성

## 🎯 발견한 Notion API 엔드포인트

### 워크스페이스 관련
- `POST /api/v3/getSpacesInitial` - 초기 워크스페이스 정보
- `POST /api/v3/getSpacesFanout` - 워크스페이스 확장 데이터
- `POST /api/v3/getTeamsV2` - 팀 정보
- `POST /api/v3/getUserOrganizations` - 사용자 조직 정보

### 멤버 관련
- `POST /api/v3/getVisibleUsers` - 가시적인 사용자 목록
- `POST /api/v3/getExtendedUserProfiles` - 확장 사용자 프로필
- `POST /api/v3/getSimilarUsers` - 유사 사용자

### 빌링 관련
- `POST /api/v3/getSubscriptionData` - 구독 데이터
- `POST /api/v3/getBillingHistory` - 빌링 이력
- `POST /api/v3/getInvoiceData` - 인보이스 데이터
- `POST /api/v3/getLegacyPriceInfo` - 가격 정보

### 기타
- `POST /api/v3/getEmailDomainSettings` - 이메일 도메인 설정
- `POST /api/v3/getAllSpacePermissionGroupsWithMemberCount` - 권한 그룹 정보

## 📁 파일 구조

```
examples/
├── README.md                           # 이 파일
├── notion-workspace-workflow.ts        # TypeScript 워크플로우 정의
└── ../test-workflow-notion-api.html    # HTML 워크플로우 예제
```

## 🚀 사용 방법

### 1. Playwright MCP로 API 탐색 (이미 완료)

```typescript
// Playwright MCP를 사용하여 Notion 사이트 탐색
await mcp_playwright_browser_navigate({ url: "https://www.notion.so/" });
await mcp_playwright_browser_wait_for({ time: 3 });
await mcp_playwright_browser_click({ element: "Settings button", ref: "e419" });
await mcp_playwright_browser_click({ element: "People tab", ref: "e693" });
await mcp_playwright_browser_click({ element: "Billing tab", ref: "e767" });

// 네트워크 요청 확인
const requests = await mcp_playwright_browser_network_requests({ random_string: "check" });
```

### 2. TypeScript 워크플로우 실행

```typescript
import { notionWorkspaceWorkflow } from './examples/notion-workspace-workflow';

// 워크플로우 정의 확인
console.log(notionWorkspaceWorkflow);

// 8g-extension SDK를 사용하여 실행
import { EightGClient } from '@8g-extension/sdk';

const client = new EightGClient();
const result = await client.executeWorkflow(notionWorkspaceWorkflow);

console.log('분석 결과:', result);
```

### 3. HTML 워크플로우 실행

브라우저에서 `test-workflow-notion-api.html`을 열면 워크플로우가 자동으로 실행됩니다:

```bash
# 로컬 서버 실행
cd /Users/kerry/Documents/GitHub/8g-extension
open test-workflow-notion-api.html
```

## 📊 출력 형식

워크플로우는 다음과 같은 구조화된 JSON을 출력합니다:

```json
{
  "workspace": {
    "name": "01Republic [스코디]",
    "id": "54e11296-3b17-4f3e-9fe7-3bb4afe717a3",
    "createdTime": "2023-06-15T10:30:00Z"
  },
  "owner": {
    "name": "김용현",
    "email": "fred@01republic.io"
  },
  "teams": [
    {
      "name": "전체",
      "memberCount": 6
    }
  ],
  "members": {
    "totalCount": 6,
    "activeMembers": [
      {
        "name": "김규리 / diana",
        "email": "diana@01republic.io",
        "role": "Member"
      },
      {
        "name": "김용현",
        "email": "fred@01republic.io",
        "role": "Workspace owner"
      }
    ],
    "guestCount": 25
  },
  "subscription": {
    "plan": "Plus",
    "monthlyCost": "$84",
    "billingPeriod": "Monthly",
    "paidSeats": 7,
    "nextBillingDate": "2025-10-28",
    "paymentMethod": "Mastercard ending in 3309"
  },
  "billingHistory": [
    {
      "date": "2025-09-28",
      "amount": "$84",
      "status": "Paid",
      "description": "Monthly subscription - Plus plan"
    }
  ],
  "summary": {
    "totalMonthlySpend": "$84",
    "activeSubscriptions": 1,
    "lastPaymentDate": "2025-09-28"
  }
}
```

## 🔧 설정

### 환경 변수

워크플로우를 실행하기 전에 OpenAI API 키를 설정해야 합니다:

```bash
export OPENAI_API_KEY="sk-proj-..."
```

또는 코드에서 직접 설정:

```typescript
const OPENAI_API_KEY = 'your-api-key-here';
```

### Notion 로그인

워크플로우를 실행하기 전에 Notion에 로그인해야 합니다. 워크플로우는 브라우저의 쿠키를 사용하여 API를 호출합니다.

## 📝 워크플로우 단계

1. **Settings 페이지 접근** - Settings 버튼 클릭
2. **워크스페이스 데이터 수집** - `getSpacesInitial` API 호출
3. **팀 정보 수집** - `getTeamsV2` API 호출
4. **멤버 정보 수집** - `getVisibleUsers` API 호출
5. **프로필 상세 수집** - `getExtendedUserProfiles` API 호출
6. **구독 정보 수집** - `getSubscriptionData` API 호출
7. **빌링 이력 수집** - `getBillingHistory` API 호출
8. **인보이스 데이터 수집** - `getInvoiceData` API 호출
9. **AI 파싱 및 분석** - OpenAI로 데이터 구조화
10. **결과 출력** - 구조화된 JSON 반환

## 🎨 AI 파싱 스키마

워크플로우는 다음과 같은 스키마를 사용하여 AI가 데이터를 구조화합니다:

```typescript
createSchema({
  workspace: Schema.object({
    name: Schema.string(),
    id: Schema.string(),
    createdTime: Schema.string({ optional: true }),
  }),
  members: Schema.object({
    totalCount: Schema.number(),
    activeMembers: Schema.array(
      Schema.object({
        name: Schema.string(),
        email: Schema.string(),
        role: Schema.string({ 
          enum: ['Workspace owner', 'Member', 'Guest'] as const 
        }),
      })
    ),
  }),
  subscription: Schema.object({
    plan: Schema.string({ 
      enum: ['Free', 'Plus', 'Business', 'Enterprise'] as const 
    }),
    monthlyCost: Schema.string(),
    paidSeats: Schema.number(),
  }),
  // ... 더 많은 필드
})
```

## 🛠️ 커스터마이징

### 추가 API 엔드포인트

더 많은 데이터를 수집하려면 워크플로우에 블록을 추가하세요:

```typescript
{
  name: 'fetch-api',
  url: 'https://www.notion.so/api/v3/getUserNotifications',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: {},
  description: '사용자 알림 수집',
}
```

### AI 프롬프트 수정

AI 파싱 동작을 변경하려면 `prompt` 필드를 수정하세요:

```typescript
{
  name: 'ai-parse-data',
  prompt: `
    다음 데이터에서 특정 패턴을 찾아주세요:
    1. 비활성 멤버 식별
    2. 미사용 팀 찾기
    3. 비용 최적화 기회 분석
  `,
  // ...
}
```

## 🔍 디버깅

워크플로우 실행 중 문제가 발생하면:

1. **브라우저 콘솔 확인**: 네트워크 요청 및 응답 확인
2. **API 응답 검사**: 각 단계의 응답 데이터 확인
3. **AI 프롬프트 조정**: 데이터 구조가 예상과 다른 경우 프롬프트 수정

```typescript
// 디버그 모드로 실행
const result = await client.executeWorkflow(notionWorkspaceWorkflow, {
  debug: true,
  logLevel: 'verbose',
});
```

## 📚 참고 자료

- [8g-extension 문서](../README.md)
- [AI Parse Block 사용법](../AI_PARSE_DATA_USAGE.md)
- [Workflow Architecture](../WORKFLOW_EXECUTION_ARCHITECTURE.md)
- [Notion API (비공식)](https://github.com/NotionX/react-notion-x)

## 🤝 기여

이 워크플로우를 개선하거나 다른 서비스에 적용한 예제를 공유하고 싶다면 PR을 보내주세요!

## 📄 라이선스

이 예제는 8g-extension 프로젝트의 라이선스를 따릅니다.

