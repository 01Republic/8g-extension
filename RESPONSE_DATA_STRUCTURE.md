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