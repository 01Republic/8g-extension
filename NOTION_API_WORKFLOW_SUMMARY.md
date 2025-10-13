# Notion API 워크플로우 작성 프로세스 요약

## 📋 작업 개요

Playwright MCP를 사용하여 Notion 사이트를 탐색하고, 네트워크 탭에서 워크스페이스 데이터를 가져오는 API 스펙을 확인한 후, 이를 AI로 파싱하는 워크플로우를 작성했습니다.

## 🔍 1단계: API 탐색 (Playwright MCP 사용)

### 실행한 작업
1. **Notion 접속**: `https://www.notion.so/` 로 이동
2. **페이지 로드 대기**: 3초 대기하여 JavaScript 로딩 완료
3. **Settings 클릭**: 설정 페이지 접근
4. **People 탭 클릭**: 멤버 관련 API 확인
5. **Billing 탭 클릭**: 빌링 관련 API 확인
6. **네트워크 요청 수집**: 모든 네트워크 요청 분석

### 사용한 MCP 도구
```typescript
- mcp_playwright_browser_navigate()
- mcp_playwright_browser_wait_for()
- mcp_playwright_browser_click()
- mcp_playwright_browser_network_requests()
- mcp_playwright_browser_close()
```

## 🎯 2단계: 발견한 API 엔드포인트

### 워크스페이스 관련 API
```
POST https://www.notion.so/api/v3/getSpacesInitial
- 초기 워크스페이스 정보 가져오기

POST https://www.notion.so/api/v3/getSpacesFanout
- 워크스페이스 확장 데이터

POST https://www.notion.so/api/v3/getTeamsV2
- 팀 정보

POST https://www.notion.so/api/v3/getUserOrganizations
- 사용자 조직 정보
```

### 멤버 관련 API
```
POST https://www.notion.so/api/v3/getVisibleUsers
- 가시적인 사용자 목록

POST https://www.notion.so/api/v3/getExtendedUserProfiles
- 사용자 프로필 상세 정보

POST https://www.notion.so/api/v3/getSimilarUsers
- 유사 사용자 추천
```

### 빌링 관련 API
```
POST https://www.notion.so/api/v3/getSubscriptionData
- 구독 정보 (플랜, 가격, 시트 수)

POST https://www.notion.so/api/v3/getBillingHistory
- 결제 이력

POST https://www.notion.so/api/v3/getInvoiceData
- 인보이스 상세 정보

POST https://www.notion.so/api/v3/getLegacyPriceInfo
- 레거시 가격 정보
```

### 기타 유용한 API
```
POST https://www.notion.so/api/v3/getEmailDomainSettings
- 이메일 도메인 설정

POST https://www.notion.so/api/v3/getAllSpacePermissionGroupsWithMemberCount
- 권한 그룹 및 멤버 수

POST https://www.notion.so/api/v3/syncRecordValuesSpaceInitial
- 워크스페이스 레코드 동기화
```

## 📝 3단계: 워크플로우 작성

### 생성된 파일

#### 1. HTML 워크플로우 (`test-workflow-notion-api.html`)
- 브라우저에서 직접 실행 가능
- 워크플로우 정의를 JSON 형식으로 포함
- 각 단계별 설명 포함
- 예상 출력 형식 예시 포함

**주요 특징:**
- ✅ 10단계 워크플로우 정의
- ✅ 각 API 호출 블록 구성
- ✅ AI 파싱 블록으로 데이터 구조화
- ✅ 결과를 콘솔에 출력

#### 2. TypeScript 워크플로우 (`examples/notion-workspace-workflow.ts`)
- 타입 안전성이 보장되는 워크플로우
- 스키마 정의를 사용한 AI 파싱
- 예상 출력 타입 정의
- 실제 실행 가능한 코드

**주요 특징:**
- ✅ 9개의 블록으로 구성
- ✅ 상세한 스키마 정의 (workspace, members, subscription, etc.)
- ✅ TypeScript 타입 정의
- ✅ 예제 사용법 포함

#### 3. README 문서 (`examples/README.md`)
- 전체 워크플로우 설명
- 사용 방법 가이드
- 출력 형식 예시
- 커스터마이징 방법
- 디버깅 팁

## 🏗️ 워크플로우 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  1. Navigate to Notion Settings                         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  2. Fetch Workspace Data (getSpacesInitial)             │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  3. Fetch Teams Data (getTeamsV2)                       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  4. Fetch Members Data (getVisibleUsers)                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  5. Fetch User Profiles (getExtendedUserProfiles)       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  6. Fetch Subscription Data (getSubscriptionData)       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  7. Fetch Billing History (getBillingHistory)           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  8. Fetch Invoice Data (getInvoiceData)                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  9. AI Parse & Structure Data                           │
│     - OpenAI GPT-4o-mini                                │
│     - Schema-based parsing                              │
│     - Structured JSON output                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  10. Output Structured Result                           │
└─────────────────────────────────────────────────────────┘
```

## 📊 AI 파싱 스키마 구조

```typescript
{
  workspace: {
    name: string,
    id: string,
    createdTime?: string,
    domain?: string
  },
  owner?: {
    name: string,
    email: string,
    userId?: string
  },
  teams: Array<{
    name: string,
    memberCount?: number
  }>,
  members: {
    totalCount: number,
    activeMembers: Array<{
      name: string,
      email: string,
      role: 'Workspace owner' | 'Member' | 'Guest'
    }>,
    guestCount?: number
  },
  subscription: {
    plan: 'Free' | 'Plus' | 'Business' | 'Enterprise',
    monthlyCost: string,
    billingPeriod: 'Monthly' | 'Yearly',
    paidSeats: number,
    nextBillingDate: string
  },
  billingHistory: Array<{
    date: string,
    amount: string,
    status: 'Paid' | 'Pending' | 'Failed' | 'Refunded'
  }>,
  summary?: {
    totalMonthlySpend: string,
    activeSubscriptions: number
  }
}
```

## 🎯 예상 출력 예시

```json
{
  "workspace": {
    "name": "01Republic [스코디]",
    "id": "54e11296-3b17-4f3e-9fe7-3bb4afe717a3"
  },
  "members": {
    "totalCount": 6,
    "activeMembers": [
      {
        "name": "김용현",
        "email": "fred@01republic.io",
        "role": "Workspace owner"
      },
      {
        "name": "선진 김",
        "email": "kerry@01republic.io",
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
    "nextBillingDate": "2025-10-28"
  }
}
```

## 🚀 실행 방법

### HTML 버전
```bash
# 브라우저에서 직접 열기
open test-workflow-notion-api.html
```

### TypeScript 버전
```typescript
import { notionWorkspaceWorkflow } from './examples/notion-workspace-workflow';
import { EightGClient } from '@8g-extension/sdk';

const client = new EightGClient();
const result = await client.executeWorkflow(notionWorkspaceWorkflow);
console.log('결과:', result);
```

## 💡 핵심 인사이트

### 1. Playwright MCP의 강력함
- 실제 브라우저 환경에서 네트워크 요청 캡처
- 클릭, 입력 등 사용자 인터랙션 자동화
- 동적 웹 애플리케이션 분석에 최적

### 2. API 스펙 자동 발견
- 수동으로 API 문서를 찾지 않아도 됨
- 실제 사용되는 API를 직접 확인 가능
- 숨겨진 API도 발견 가능

### 3. AI 파싱의 유용성
- 복잡한 API 응답을 구조화된 데이터로 변환
- 스키마 기반 검증으로 데이터 품질 보장
- 다양한 형식의 데이터를 통일된 형식으로 변환

## 🔧 확장 가능성

### 다른 서비스에 적용
이 프로세스는 다음 서비스에도 적용할 수 있습니다:
- ✅ Slack - 워크스페이스 및 멤버 관리
- ✅ GitHub - 조직 및 리포지토리 정보
- ✅ Google Workspace - 관리자 설정
- ✅ Microsoft 365 - 구독 및 사용자 관리
- ✅ Figma - 팀 및 프로젝트 정보
- ✅ AWS - 빌링 및 리소스 현황

### 추가 기능 아이디어
- 📊 **대시보드 생성**: 수집된 데이터를 시각화
- 📧 **자동 리포트**: 주기적으로 워크스페이스 현황 리포트 전송
- 💰 **비용 최적화**: 미사용 리소스 식별 및 권장사항 제공
- 👥 **멤버 분석**: 활동 패턴 분석 및 인사이트 제공
- 🔔 **알림 설정**: 특정 이벤트 발생 시 알림

## 📚 관련 문서

- [AI Parse Data 사용법](./AI_PARSE_DATA_USAGE.md)
- [워크플로우 실행 아키텍처](./WORKFLOW_EXECUTION_ARCHITECTURE.md)
- [블록 실행 아키텍처](./BLOCK_EXECUTION_ARCHITECTURE.md)
- [예제 README](./examples/README.md)

## 🎉 결론

이 워크플로우는 다음을 보여줍니다:

1. **Playwright MCP의 활용**: 웹 애플리케이션 자동화 및 API 탐색
2. **API 스펙 자동 발견**: 네트워크 탭 분석으로 API 엔드포인트 식별
3. **데이터 수집 자동화**: 여러 API를 순차적으로 호출하여 데이터 수집
4. **AI 파싱**: 복잡한 데이터를 구조화된 형식으로 변환
5. **재사용 가능한 워크플로우**: 다른 서비스에도 쉽게 적용 가능

이러한 접근 방식은 **수동 작업을 자동화**하고, **데이터를 체계적으로 관리**하며, **인사이트를 빠르게 도출**하는 데 매우 유용합니다.

