# Response Data Structure

## 개요

8G Extension SDK의 모든 메서드는 일관된 응답 구조를 제공합니다. 이 문서는 응답 데이터의 구조와 접근 방법을 설명합니다.

## 기본 응답 구조

모든 SDK 메서드는 `CollectWorkflowResult<T>` 타입을 반환하며, 다음과 같은 구조를 가집니다:

```typescript
interface CollectWorkflowResult<T> {
  success: boolean;                              // 워크플로우 전체 성공 여부
  data: ResDataContainer<T>;                     // 응답 데이터 컨테이너
  steps: WorkflowStepRunResult<T>[];            // 각 스텝 실행 결과
  context: ExecutionContext;                    // 실행 컨텍스트
  targetUrl: string;                           // 대상 URL
  timestamp: string;                           // 실행 시간
  error?: string;                              // 에러 메시지 (실패시)
}
```

## ResDataContainer 구조

실제 데이터는 `ResDataContainer<T>` 구조로 래핑되어 있습니다:

```typescript
interface ResDataContainer<T> {
  success: boolean;    // 데이터 수집 성공 여부
  message?: string;    // 메시지 (선택적)
  data?: T;           // 실제 데이터
}
```

## 데이터 접근 방법

### 단일 객체 응답 (예: getWorkspaceBilling)

```typescript
const result = await client.getWorkspaceBilling(workspaceKey, slug, request);

// 워크플로우 전체 성공 여부 확인
if (result.success) {
  // 데이터 수집 성공 여부 확인
  if (result.data.success) {
    // 실제 데이터 접근
    const billingData = result.data.data; // WorkspaceBillingDto
    console.log(billingData.planName);    // "Pro"
    console.log(billingData.cardNumber);  // "3309"
  } else {
    console.error('Data collection failed:', result.data.message);
  }
} else {
  console.error('Workflow failed:', result.error);
}
```

### 배열 응답 (예: getWorkspaces)

```typescript
const result = await client.getWorkspaces(request);

if (result.success) {
  if (result.data.success) {
    const workspaces = result.data.data; // WorkspaceItemDto[]
    workspaces.forEach(workspace => {
      console.log(workspace.name, workspace.memberCount);
    });
  } else {
    console.error('Data collection failed:', result.data.message);
  }
} else {
  console.error('Workflow failed:', result.error);
}
```

## 성공/실패 판단 로직

### 2단계 성공 체크가 필요한 이유

1. **워크플로우 레벨 성공 (`result.success`)**
   - 전체 워크플로우가 정상 실행되었는지 여부
   - 네트워크 오류, 확장프로그램 미설치, 타임아웃 등으로 실패 가능

2. **데이터 수집 레벨 성공 (`result.data.success`)**
   - 각 페이지에서 원하는 데이터를 제대로 수집했는지 여부
   - 페이지 구조 변경, 권한 부족, 요소 미존재 등으로 실패 가능

### 권장 에러 핸들링

```typescript
try {
  const result = await client.getWorkspaceBilling(workspaceKey, slug, request);
  
  if (!result.success) {
    throw new Error(`Workflow failed: ${result.error}`);
  }
  
  if (!result.data.success) {
    throw new Error(`Data collection failed: ${result.data.message}`);
  }
  
  // 성공 - 데이터 사용
  const billing = result.data.data;
  return billing;
  
} catch (error) {
  console.error('Operation failed:', error);
  // 적절한 에러 처리
}
```

## 응답 예시

### 성공적인 단일 객체 응답

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": {
      "planName": "Pro",
      "currentCycleBillAmount": {
        "code": "USD",
        "symbol": "$",
        "format": "%n %s",
        "amount": 52.5,
        "text": "$52.50 USD"
      },
      "nextPaymentDue": "2025-12-18",
      "cycleTerm": "Monthly",
      "isFreeTier": false,
      "isPerUser": true,
      "paidMemberCount": 6,
      "usedMemberCount": 6,
      "unitPrice": {
        "code": "USD",
        "symbol": "$",
        "format": "%n %s", 
        "amount": 8.75,
        "text": "$8.75 USD"
      },
      "cardNumber": "3309",
      "cardName": "mastercard"
    }
  },
  "steps": [...],
  "context": {...},
  "targetUrl": "https://01republic.slack.com/admin/billing",
  "timestamp": "2025-11-21T07:51:07.391Z"
}
```

### 성공적인 배열 응답

```json
{
  "success": true,
  "data": {
    "success": true,
    "data": [
      {
        "id": "01republic",
        "slug": "01republic",
        "name": "01Republic",
        "image": "https://avatars.slack-edge.com/...",
        "memberCount": 8,
        "isAdmin": true
      }
    ]
  },
  "steps": [...],
  "context": {...},
  "targetUrl": "https://slack.com/signin",
  "timestamp": "2025-11-21T07:51:07.391Z"
}
```

### 데이터 수집 실패 응답

```json
{
  "success": true,
  "data": {
    "success": false,
    "message": "Required element not found on page",
    "data": null
  },
  "steps": [...],
  "context": {...},
  "targetUrl": "https://example.com",
  "timestamp": "2025-11-21T07:51:07.391Z"
}
```

### 워크플로우 실패 응답

```json
{
  "success": false,
  "error": "Workflow execution timeout",
  "data": null,
  "steps": [...],
  "context": {...},
  "targetUrl": "https://example.com",
  "timestamp": "2025-11-21T07:51:07.391Z"
}
```

## 주의사항

1. **항상 2단계로 성공 여부를 확인하세요**
   - `result.success` (워크플로우 레벨)
   - `result.data.success` (데이터 수집 레벨)

2. **타입 안전성을 위해 제네릭을 활용하세요**
   ```typescript
   const result: CollectWorkflowResult<WorkspaceBillingDto> = await client.getWorkspaceBilling(...);
   ```

3. **적절한 에러 핸들링을 구현하세요**
   - 네트워크 오류, 타임아웃, 권한 문제 등을 고려

4. **steps와 context를 활용한 디버깅**
   - `result.steps`: 각 스텝별 실행 결과 확인
   - `result.context`: 워크플로우 실행 컨텍스트 및 변수 상태 확인

---

## 새로운 스펙: addMembers / deleteMembers

### 개요

`addMembers`와 `deleteMembers` 메소드는 기존 응답 구조와 다르게, **개별 이메일별 성공/실패 결과**를 제공하는 새로운 스펙을 적용합니다.

### 새로운 응답 구조

```typescript
// addMembers / deleteMembers 전용 응답 구조
interface CollectWorkflowResult<MemberOperationResult> {
  success: boolean;                              // 워크플로우 전체 성공 여부
  data: ResDataContainer<MemberOperationResult>[];  // 각 이메일별 결과 배열
  steps: WorkflowStepRunResult[];               // 각 스텝 실행 결과
  context: ExecutionContext;                    // 실행 컨텍스트
  targetUrl: string;                           // 대상 URL
  timestamp: string;                           // 실행 시간
  error?: string;                              // 에러 메시지 (실패시)
}

// 멤버 조작 결과 타입
interface MemberOperationResult {
  email: string;
  operation: 'add' | 'delete';
  completed: boolean;
  reason?: string;
}
```

### 사용 예시

#### 3명의 멤버 추가 시나리오
```typescript
const emails = ['user1@example.com', 'user2@example.com', 'invalid-email'];
const result = await client.addMembers(workspaceKey, slug, emails, request);

// 응답 예시:
{
  success: true,  // 워크플로우는 성공적으로 완료
  data: [
    {
      success: true,
      data: {
        email: "user1@example.com",
        operation: "add",
        completed: true
      }
    },
    {
      success: false,
      message: "User already exists",
      data: {
        email: "user2@example.com", 
        operation: "add",
        completed: false,
        reason: "Already a member"
      }
    },
    {
      success: false,
      message: "Invalid email format",
      data: {
        email: "invalid-email",
        operation: "add", 
        completed: false,
        reason: "Invalid email format"
      }
    }
  ],
  steps: [...],
  context: {...},
  targetUrl: "https://workspace.example.com",
  timestamp: "2023-12-01T10:00:00Z"
}
```

### 클라이언트 사용법

```typescript
// addMembers 사용 예시
const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
const result = await client.addMembers(workspaceKey, slug, emails, request);

if (result.success) {
  // 각 멤버별 결과 처리
  result.data.forEach((memberResult, index) => {
    const email = emails[index];
    if (memberResult.success && memberResult.data?.completed) {
      console.log(`✅ ${email} added successfully`);
    } else {
      const reason = memberResult.data?.reason || memberResult.message;
      console.log(`❌ ${email} failed: ${reason}`);
    }
  });

  // 통계 정보
  const successCount = result.data.filter(r => r.success && r.data?.completed).length;
  const failureCount = result.data.length - successCount;
  console.log(`Success: ${successCount}, Failed: ${failureCount}`);
} else {
  console.error('Workflow failed:', result.error);
}
```

### API 설계 개선안

#### 현재 문제점
```typescript
// 현재: 전체 성공/실패만 알 수 있음
async addMembers(...): Promise<CollectWorkflowResult> {
  const result = await this.collectWorkflow(request);
  if (!result.success) {
    throw new EightGError('Failed to add members', 'ADD_MEMBERS_FAILED');
  }
  return { ...result };
}
```

#### 개선된 설계
```typescript
async addMembers(
  workspaceKey: string,
  slug: string, 
  emails: string[],
  request: CollectWorkflowRequest
): Promise<CollectWorkflowResult<MemberOperationResult>> {
  request.workflow.vars = {
    ...request.workflow.vars,
    workspaceKey,
    slug,
    emails,
  };

  const result = await this.collectWorkflow(request);
  
  // 워크플로우 자체가 실패한 경우에만 에러 throw
  // 개별 멤버 실패는 data 배열에서 처리
  if (!result.success && result.error) {
    throw new EightGError(result.error, 'ADD_MEMBERS_WORKFLOW_FAILED');
  }

  // result.data는 이미 ResDataContainer<MemberOperationResult>[] 형태
  return result as CollectWorkflowResult<MemberOperationResult>;
}

async deleteMembers(
  workspaceKey: string,
  slug: string,
  emails: string[], 
  request: CollectWorkflowRequest
): Promise<CollectWorkflowResult<MemberOperationResult>> {
  // addMembers와 동일한 패턴
  request.workflow.vars = {
    ...request.workflow.vars,
    workspaceKey,
    slug, 
    emails,
  };

  const result = await this.collectWorkflow(request);
  
  if (!result.success && result.error) {
    throw new EightGError(result.error, 'DELETE_MEMBERS_WORKFLOW_FAILED');
  }

  return result as CollectWorkflowResult<MemberOperationResult>;
}
```

### 워크플로우 구현 요구사항

이 새로운 스펙을 지원하려면 워크플로우에서 다음과 같은 구조가 필요합니다:

1. **forEach 반복**: `vars.emails` 배열을 순회
2. **개별 결과 수집**: 각 이메일별로 `ResDataContainer` 생성
3. **에러 처리**: `continueOnError: true`로 실패해도 계속 진행

```json
{
  "steps": [
    {
      "id": "processMembers",
      "repeat": {
        "forEach": "vars.emails",
        "continueOnError": true,
        "delayBetween": 200
      },
      "block": {
        "name": "add-member-action",
        "selector": "...",
        "option": {}
      }
    }
  ]
}
```

### 기존 API와의 차이점

| API | 기존 스펙 | addMembers/deleteMembers 스펙 |
|-----|----------|------------------------------|
| data 구조 | `ResDataContainer<T>` | `ResDataContainer<T>[]` |
| 결과 입도 | 전체 성공/실패 | 개별 아이템별 성공/실패 |
| 에러 처리 | 전체 실패시 throw | 워크플로우 실패시에만 throw |
| 사용 사례 | 단일/목록 조회 | 다중 아이템 처리 |

### 마이그레이션 체크리스트

- [ ] `MemberOperationResult` 타입 정의
- [ ] `addMembers` 메소드 수정
- [ ] `deleteMembers` 메소드 수정
- [ ] 워크플로우에서 배열 결과 수집 지원
- [ ] 클라이언트 코드 업데이트 가이드 작성

---

## 워크플로우 마지막 execute-javascript 결과 매핑 예시

워크플로우 마지막에 `execute-javascript` 블록을 사용하여 `result.data`에 직접 매핑되는 결과를 반환할 수 있습니다.

### deleteMembers 예시 (Slack - forEach 반복 사용)

```javascript
(() => {
  const its = ${steps.node_1763108868768.result.data}.iterations;
  const emails = ${vars.emails};

  return its.map(i => ({
    email: emails[i.index],
    operation: 'delete',
    completed: i.success,
    reason: i.success ? undefined : (i.steps.find(s => !s.success)?.message || 'Unknown error')
  }));
})();
```

### addMembers 예시 (Notion - 멤버 리스트 검증)

```javascript
(async () => {
  var wait = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };

  await wait(1000);

  var results = [];
  var targetEmails = ${vars.emails};
  var memberListContainer = document.querySelector('#settings-tabpanel-members > div:nth-child(1) > div > div:nth-child(4) > div:nth-child(5)');

  if (!memberListContainer) {
    return targetEmails.map(function(email) {
      return { email: email, operation: 'add', completed: false, reason: '멤버 리스트 컨테이너를 찾을 수 없습니다.' };
    });
  }

  var memberEmails = new Set();
  var memberItems = memberListContainer.querySelectorAll('div[data-index]');

  for (var i = 0; i < memberItems.length; i++) {
    var emailElement = memberItems[i].querySelector('[title] + div');
    if (emailElement && emailElement.textContent) {
      var email = emailElement.textContent.trim().toLowerCase();
      if (email && email.indexOf('@') !== -1) {
        memberEmails.add(email);
      }
    }
  }

  for (var j = 0; j < targetEmails.length; j++) {
    var targetEmail = targetEmails[j];
    var isMember = memberEmails.has(targetEmail.toLowerCase().trim());

    results.push({
      email: targetEmail,
      operation: 'add',
      completed: isMember,
      reason: isMember ? undefined : 'Email not found in member list after invitation'
    });
  }

  return results;
})();
```

### 주의사항

- `execute-javascript` 블록에서 반환하는 값이 그대로 `result.data`에 매핑됩니다
- `ResDataContainer` 래핑 없이 `MemberOperationResult[]` 배열을 직접 반환합니다
- async 함수 사용 시 `(async () => { ... })();` 형태로 즉시 실행
- ES5 문법 사용 권장 (`var`, 일반 `function`, `indexOf` 등)