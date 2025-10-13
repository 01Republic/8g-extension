/**
 * Notion Workspace Data Extraction & AI Parsing Workflow
 * 
 * 이 워크플로우는 다음을 수행합니다:
 * 1. Notion API를 호출하여 워크스페이스, 멤버, 빌링 데이터를 수집
 * 2. AI를 사용하여 수집된 데이터를 구조화
 * 3. 분석 결과를 JSON 형식으로 출력
 */

import { createSchema, Schema } from '../src/blocks/AiParseDataBlock';

// API 키 설정 (환경 변수에서 가져오기)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';

/**
 * Notion 워크스페이스 데이터 수집 워크플로우
 */
export const notionWorkspaceWorkflow = {
  name: 'notion-workspace-analysis',
  description: 'Notion 워크스페이스 정보 수집 및 AI 분석',
  
  blocks: [
    // 1. Settings 페이지로 이동 (이미 로그인된 상태 가정)
    {
      name: 'event-click',
      findBy: 'css',
      selector: 'button[aria-label="Settings"]',
      description: 'Settings 버튼 클릭',
    },

    // 2. 워크스페이스 초기 데이터 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getSpacesInitial',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '워크스페이스 초기 데이터 수집',
    },

    // 3. 팀 정보 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getTeamsV2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '팀 정보 수집',
    },

    // 4. 멤버 정보 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getVisibleUsers',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '가시적인 사용자 목록 수집',
    },

    // 5. 확장 사용자 프로필 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getExtendedUserProfiles',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '사용자 프로필 상세 정보 수집',
    },

    // 6. 구독 데이터 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getSubscriptionData',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '구독 정보 수집',
    },

    // 7. 빌링 히스토리 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getBillingHistory',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '빌링 이력 수집',
    },

    // 8. 인보이스 데이터 수집
    {
      name: 'fetch-api',
      url: 'https://www.notion.so/api/v3/getInvoiceData',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 10000,
      parseJson: true,
      returnHeaders: false,
      description: '인보이스 데이터 수집',
    },

    // 9. AI를 사용하여 데이터 파싱
    {
      name: 'ai-parse-data',
      // sourceData는 이전 스텝들의 결과를 모두 받습니다
      sourceData: '{{$results}}', // 모든 이전 블록 결과
      schemaDefinition: createSchema({
        workspace: Schema.object({
          name: Schema.string({ description: '워크스페이스 이름' }),
          id: Schema.string({ description: '워크스페이스 ID' }),
          createdTime: Schema.string({ 
            description: '생성 날짜 (ISO 8601 형식)', 
            optional: true 
          }),
          domain: Schema.string({ 
            description: '워크스페이스 도메인', 
            optional: true 
          }),
        }),

        owner: Schema.object({
          name: Schema.string({ description: '소유자 이름' }),
          email: Schema.string({ description: '소유자 이메일' }),
          userId: Schema.string({ description: '소유자 ID', optional: true }),
        }, { optional: true }),

        teams: Schema.array(
          Schema.object({
            name: Schema.string({ description: '팀 이름' }),
            teamId: Schema.string({ description: '팀 ID', optional: true }),
            memberCount: Schema.number({ description: '멤버 수', optional: true }),
            description: Schema.string({ description: '팀 설명', optional: true }),
          })
        ),

        members: Schema.object({
          totalCount: Schema.number({ description: '전체 멤버 수' }),
          activeMembers: Schema.array(
            Schema.object({
              name: Schema.string({ description: '멤버 이름' }),
              email: Schema.string({ description: '멤버 이메일' }),
              role: Schema.string({ 
                description: '멤버 역할', 
                enum: ['Workspace owner', 'Member', 'Guest'] as const 
              }),
              userId: Schema.string({ description: '사용자 ID', optional: true }),
              joinDate: Schema.string({ description: '가입 날짜', optional: true }),
            })
          ),
          guestCount: Schema.number({ description: '게스트 수', optional: true }),
        }),

        subscription: Schema.object({
          plan: Schema.string({ 
            description: '현재 플랜', 
            enum: ['Free', 'Plus', 'Business', 'Enterprise'] as const 
          }),
          monthlyCost: Schema.string({ description: '월간 비용 (예: $84)' }),
          billingPeriod: Schema.string({ 
            description: '결제 주기', 
            enum: ['Monthly', 'Yearly'] as const 
          }),
          paidSeats: Schema.number({ description: '유료 시트 수' }),
          nextBillingDate: Schema.string({ description: '다음 결제일 (YYYY-MM-DD)' }),
          paymentMethod: Schema.string({ 
            description: '결제 수단', 
            optional: true 
          }),
        }),

        billingHistory: Schema.array(
          Schema.object({
            date: Schema.string({ description: '결제 날짜 (YYYY-MM-DD)' }),
            amount: Schema.string({ description: '금액 (예: $84)' }),
            status: Schema.string({ 
              description: '결제 상태', 
              enum: ['Paid', 'Pending', 'Failed', 'Refunded'] as const 
            }),
            description: Schema.string({ description: '결제 설명', optional: true }),
            invoiceId: Schema.string({ description: '인보이스 ID', optional: true }),
          })
        ),

        summary: Schema.object({
          totalMonthlySpend: Schema.string({ description: '총 월간 지출' }),
          activeSubscriptions: Schema.number({ description: '활성 구독 수' }),
          lastPaymentDate: Schema.string({ description: '마지막 결제일', optional: true }),
          workspaceCreatedDate: Schema.string({ description: '워크스페이스 생성일', optional: true }),
        }, { optional: true }),
      }),
      
      prompt: `
다음 데이터는 Notion API로부터 수집한 워크스페이스 정보입니다.
각 API 응답이 배열 형태로 제공되며, 순서대로:
1. getSpacesInitial - 워크스페이스 초기 정보
2. getTeamsV2 - 팀 정보
3. getVisibleUsers - 사용자 목록
4. getExtendedUserProfiles - 사용자 프로필 상세
5. getSubscriptionData - 구독 정보
6. getBillingHistory - 빌링 이력
7. getInvoiceData - 인보이스 데이터

이 데이터를 분석하여 제공된 스키마 형식에 맞게 구조화해주세요.

주의사항:
- 날짜는 ISO 8601 형식 또는 YYYY-MM-DD 형식으로 변환
- 금액은 통화 기호와 함께 문자열로 표시 (예: "$84")
- enum 값은 정확히 일치해야 함
- 데이터가 없는 필드는 optional로 표시된 경우 생략 가능
- 멤버 역할은 "Workspace owner", "Member", "Guest" 중 하나여야 함
- 빌링 상태는 "Paid", "Pending", "Failed", "Refunded" 중 하나여야 함

추가로 summary 섹션에서 전체 워크스페이스의 요약 정보를 제공해주세요.
`,
      
      model: 'gpt-4o-mini',
      apiKey: OPENAI_API_KEY,
      description: 'AI로 Notion 데이터 구조화 및 분석',
    },
  ],
};

/**
 * 워크플로우 실행 결과 타입
 */
export interface NotionWorkspaceAnalysis {
  workspace: {
    name: string;
    id: string;
    createdTime?: string;
    domain?: string;
  };
  owner?: {
    name: string;
    email: string;
    userId?: string;
  };
  teams: Array<{
    name: string;
    teamId?: string;
    memberCount?: number;
    description?: string;
  }>;
  members: {
    totalCount: number;
    activeMembers: Array<{
      name: string;
      email: string;
      role: 'Workspace owner' | 'Member' | 'Guest';
      userId?: string;
      joinDate?: string;
    }>;
    guestCount?: number;
  };
  subscription: {
    plan: 'Free' | 'Plus' | 'Business' | 'Enterprise';
    monthlyCost: string;
    billingPeriod: 'Monthly' | 'Yearly';
    paidSeats: number;
    nextBillingDate: string;
    paymentMethod?: string;
  };
  billingHistory: Array<{
    date: string;
    amount: string;
    status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
    description?: string;
    invoiceId?: string;
  }>;
  summary?: {
    totalMonthlySpend: string;
    activeSubscriptions: number;
    lastPaymentDate?: string;
    workspaceCreatedDate?: string;
  };
}

/**
 * 예상 출력 예시
 */
export const expectedOutput: NotionWorkspaceAnalysis = {
  workspace: {
    name: '01Republic [스코디]',
    id: '54e11296-3b17-4f3e-9fe7-3bb4afe717a3',
    createdTime: '2023-06-15T10:30:00Z',
  },
  owner: {
    name: '김용현',
    email: 'fred@01republic.io',
    userId: 'user-123',
  },
  teams: [
    {
      name: '전체',
      teamId: 'team-001',
      memberCount: 6,
    },
  ],
  members: {
    totalCount: 6,
    activeMembers: [
      {
        name: '김규리 / diana',
        email: 'diana@01republic.io',
        role: 'Member',
      },
      {
        name: '김용현',
        email: 'fred@01republic.io',
        role: 'Workspace owner',
      },
      {
        name: '보람 김',
        email: 'lucy@01republic.io',
        role: 'Workspace owner',
      },
      {
        name: '선진 김',
        email: 'kerry@01republic.io',
        role: 'Workspace owner',
      },
      {
        name: '양형우',
        email: 'leo@01republic.io',
        role: 'Member',
      },
      {
        name: '윤미주',
        email: 'holly@01republic.io',
        role: 'Member',
      },
    ],
    guestCount: 25,
  },
  subscription: {
    plan: 'Plus',
    monthlyCost: '$84',
    billingPeriod: 'Monthly',
    paidSeats: 7,
    nextBillingDate: '2025-10-28',
    paymentMethod: 'Mastercard ending in 3309',
  },
  billingHistory: [
    {
      date: '2025-09-28',
      amount: '$84',
      status: 'Paid',
      description: 'Monthly subscription - Plus plan',
      invoiceId: 'inv-2025-09',
    },
    {
      date: '2025-08-28',
      amount: '$84',
      status: 'Paid',
      description: 'Monthly subscription - Plus plan',
      invoiceId: 'inv-2025-08',
    },
    {
      date: '2025-07-28',
      amount: '$84',
      status: 'Paid',
      description: 'Monthly subscription - Plus plan',
      invoiceId: 'inv-2025-07',
    },
  ],
  summary: {
    totalMonthlySpend: '$84',
    activeSubscriptions: 1,
    lastPaymentDate: '2025-09-28',
    workspaceCreatedDate: '2023-06-15',
  },
};

/**
 * 사용 예시
 */
export function exampleUsage() {
  console.log('=== Notion Workspace Workflow ===\n');
  console.log('워크플로우 이름:', notionWorkspaceWorkflow.name);
  console.log('설명:', notionWorkspaceWorkflow.description);
  console.log('\n블록 수:', notionWorkspaceWorkflow.blocks.length);
  console.log('\n실행 단계:');
  
  notionWorkspaceWorkflow.blocks.forEach((block, index) => {
    console.log(`${index + 1}. ${block.name} - ${block.description || 'No description'}`);
  });

  console.log('\n\n=== 예상 출력 ===\n');
  console.log(JSON.stringify(expectedOutput, null, 2));
}

// 모듈로 export
export default notionWorkspaceWorkflow;

