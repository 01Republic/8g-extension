# 8G Extension Architecture

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Workflow Execution Flow](#workflow-execution-flow)
4. [Message Communication](#message-communication)
5. [Block System](#block-system)
6. [Special Features](#special-features)

## Overview

8G Extension은 Chrome Extension Manifest V3 기반의 브라우저 자동화 도구입니다. 웹페이지 데이터 수집, 자동화, 워크플로우 실행을 담당합니다.

### 주요 레이어
```
┌─────────────────────────────────────┐
│         Web Page (SDK)              │
│       EightGClient.ts               │
└──────────────┬──────────────────────┘
               │ window.postMessage
               ▼
┌─────────────────────────────────────┐
│       Content Script                │
│   MessageKernel, Handlers, UI       │
└──────────────┬──────────────────────┘
               │ chrome.runtime
               ▼
┌─────────────────────────────────────┐
│    Background Service Worker        │
│  WorkflowService, TabManager, etc   │
└─────────────────────────────────────┘
```

## Core Components

### 1. Background Service Worker (`/src/background/`)

#### BackgroundManager (`chrome/BackgroundManager.ts`)
- 모든 메시지의 중앙 라우터
- 각 서비스로 메시지 분배
- 주요 메시지 타입:
  - `COLLECT_WORKFLOW` - 워크플로우 실행 요청
  - `COMPLETE_WORKSPACE_SELECTION` - 워크스페이스 선택 완료
  - `REFRESH_WORKSPACE_WORKFLOW` - 워크플로우 새로고침

#### WorkflowService (`service/WorkflowService.ts`)
```typescript
class WorkflowService {
  // 워크플로우 실행 관리
  handleCollectWorkflow() {
    // 1. 워크플로우 검증
    // 2. WorkflowRunner.run() 실행
    // 3. 결과 반환
  }
  
  // getWorkspaces 타입 특별 처리
  executeWithHooks() {
    if (workflowType === 'getWorkspaces') {
      // 1. 워크플로우 실행
      // 2. SideModal에 워크스페이스 표시
      // 3. Promise로 대기 (authenticate 버튼 기다림)
      // 4. refresh 시 기존 Promise 유지
    }
  }
  
  completeWorkspaceSelection() // authenticate 버튼 처리
  refreshWorkspaceWorkflow()    // refresh 버튼 처리
}
```

#### TabManager (`chrome/TabManager.ts`)
- 탭 생성/관리
- 블록 실행 명령 전송
- UI 컨트롤 (ExecutionStatus, SideModal)

### 2. Workflow Engine (`/src/workflow/`)

#### WorkflowRunner (`WorkflowRunner.ts`)
```typescript
class WorkflowRunner {
  run(workflow) {
    // 1. 새 탭 생성
    // 2. executeWithHooks 호출
    // 3. 워크플로우 스텝 실행
    // 4. 결과 반환
  }
  
  runInExistingTab(workflow, tabId) {
    // refresh용 - 기존 탭에서 재실행
  }
}
```

#### Step Executor (`step-executor/`)
- 조건 평가 (`condition-evaluator.ts`)
- 데이터 바인딩 (`data-binding.ts`)
- 반복 실행 (`repeat-executor.ts`)
- 서브트리 실행 (`subtree-executor.ts`)

#### Execution Context (`context/`)
```typescript
ExecutionContext = {
  stepContext: { steps: { [stepId]: result } },
  varContext: { vars: { ... } },
  loopContext: { forEach?, loop? }
}
```

### 3. Content Script (`/src/content/`)

#### MessageKernel (`kernel/MessageKernel.ts`)
- 중앙 메시지 처리
- 블록 실행 관리
- 동기화 락 관리

#### Message Handlers
- **ExternalMessageHandler** - 웹페이지 ↔ Content Script (window.postMessage)
- **InternalMessageHandler** - Content Script ↔ Background (chrome.runtime)

#### UI Components (`components/`)
- **ExecutionStatusUI** - 워크플로우 실행 상태 표시
- **SideModal** - 워크스페이스 선택 UI
  - `isLoading` 상태로 refresh 스피너 표시
  - authenticate/refresh 버튼 처리

### 4. SDK (`/src/sdk/`)

#### EightGClient (`EightGClient.ts`)
```typescript
class EightGClient {
  // 워크플로우 실행
  collectWorkflow(request) {
    // window.postMessage로 extension에 요청
    // Promise로 결과 대기
  }
  
  // 워크스페이스 조회
  getWorkspaces(request) {
    request.workflow.workflowType = 'getWorkspaces';
    return this.collectWorkflow(request);
  }
}
```

### 5. Block System (`/src/blocks/`)

각 블록은 다음 구조를 가짐:
```typescript
{
  TypeSchema,        // Zod 스키마
  validateBlock(),   // 유효성 검증
  handleBlock()      // 실행 로직
}
```

블록 타입:
- **Data Extraction**: get-text, attribute-value, get-element-data
- **Form Handling**: get/set/clear-value-form
- **Interaction**: event-click, keypress, scroll
- **Utilities**: wait, element-exists, save-assets
- **API/AI**: fetch-api, ai-parse-data, transform-data
- **Navigation**: navigate, wait-for-condition

## Workflow Execution Flow

### 일반 워크플로우 실행
```
1. SDK: client.collectWorkflow(request)
   ↓
2. Content Script: ExternalMessageHandler 수신
   ↓
3. Background: WorkflowService.handleCollectWorkflow()
   ↓
4. WorkflowRunner.run()
   - 탭 생성
   - executeWithHooks() 호출
   ↓
5. executeWorkflowSegment()
   - 각 스텝 실행
   - 조건 평가
   - 데이터 바인딩
   ↓
6. TabManager.executeBlock()
   ↓
7. Content Script: BlockHandler.executeBlock()
   ↓
8. 결과 수집 및 반환
```

### getWorkspaces 워크플로우 실행 (특별 케이스)
```
1. SDK: client.getWorkspaces(request)
   - workflowType = 'getWorkspaces' 설정
   ↓
2-4. 일반 플로우와 동일
   ↓
5. executeWithHooks()에서 특별 처리:
   - 워크플로우 실행
   - 워크스페이스 데이터 추출
   - SideModal 표시
   - Promise로 블로킹 (처음 실행 시)
   ↓
6. 사용자 액션 대기:
   
   a) Authenticate 버튼:
      - completeWorkspaceSelection()
      - Promise resolve
      - 최신 결과 반환
   
   b) Refresh 버튼:
      - refreshWorkspaceWorkflow()
      - 탭 강제 새로고침
      - targetUrl로 이동
      - runInExistingTab() 실행
      - 기존 Promise 유지 (새로 만들지 않음)
      - 워크스페이스 데이터 업데이트
```

## Message Communication

### 메시지 흐름
```
Web Page ←→ Content Script ←→ Background ←→ Tabs
         ↑                   ↑             ↑
    window.postMessage  chrome.runtime  chrome.tabs
```

### 메시지 타입

#### External Messages (`8G_*` prefix)
- `8G_CHECK_EXTENSION` - Extension 설치 확인
- `8G_COLLECT_WORKFLOW` - 워크플로우 실행 요청
- `8G_COLLECT_RESPONSE` - 워크플로우 실행 응답

#### Internal Messages
- `EXECUTE_BLOCK` - 블록 실행 명령
- `SHOW/HIDE_EXECUTION_STATUS` - 실행 상태 UI
- `SHOW/HIDE_SIDE_MODAL` - SideModal UI
- `UPDATE_SIDE_MODAL_WORKSPACES` - 워크스페이스 데이터 업데이트

## Special Features

### 1. Dynamic UI Mounting
- SideModal은 처음부터 마운트되지 않음
- `8g-mount-side-modal` 이벤트로 동적 마운트
- getWorkspaces 워크플로우 실행 시에만 마운트

### 2. Promise 관리 시스템
```typescript
workspacePromises: Map<tabId, {
  resolve: () => void,
  reject: (error) => void
}>
```
- 각 탭별로 Promise 핸들러 관리
- refresh 시 기존 Promise 유지
- authenticate 시 최신 결과 반환

### 3. 워크플로우 컨텍스트
```typescript
{
  steps: { [stepId]: { result, success, skipped } },
  vars: { ... },
  forEach?: { item, index, total },
  loop?: { index, count }
}
```

### 4. 블록 실행 동기화
- `synchronizedLock.ts`로 순차 실행 보장
- 여러 블록이 동시에 실행되지 않도록 관리

### 5. Refresh 메커니즘
1. 탭 강제 새로고침 (`bypassCache: true`)
2. targetUrl로 재이동
3. 기존 탭에서 워크플로우 재실행
4. Promise는 새로 생성하지 않음
5. 워크스페이스 데이터만 업데이트

## 디렉토리 구조

```
src/
├── background/           # Service Worker
│   ├── chrome/          # 브라우저 API 래퍼
│   ├── service/         # 비즈니스 로직
│   └── index.ts
├── workflow/            # 워크플로우 엔진
│   ├── context/         # 실행 컨텍스트
│   ├── step-executor/   # 스텝 실행 로직
│   └── WorkflowRunner.ts
├── content/             # Content Script
│   ├── kernel/          # 메시지 커널
│   ├── handler/         # 메시지 핸들러
│   ├── components/      # React UI
│   └── main.tsx
├── blocks/              # 블록 구현체
├── sdk/                 # 브라우저 SDK
└── types/               # TypeScript 타입
```

## 핵심 실행 순서

1. **SDK 호출** → 2. **메시지 전달** → 3. **워크플로우 파싱** → 4. **탭 생성** → 5. **스텝별 실행** → 6. **블록 실행** → 7. **결과 수집** → 8. **응답 반환**

특별히 `getWorkspaces`의 경우:
- 5.5. **SideModal 표시** → 6. **사용자 대기** → 7. **Authenticate/Refresh** → 8. **결과 반환**