# 워크플로우 진행상황 체크 사이드패널 - 요구사항 명세서

## 📋 프로젝트 개요

워크플로우 실행 중 사용자와의 상호작용을 위한 Chrome 사이드패널 기능 구현

### 목적
- 워크플로우 실행 중 특정 상태를 사용자가 확인하고 검증할 수 있도록 함
- 로그인 상태, 페이지 로딩 상태 등을 사용자가 직접 확인하고 피드백 제공
- 자동화와 수동 확인의 하이브리드 접근 방식 제공

## 🎯 핵심 기능 요구사항

### 1. 사이드패널 시스템

#### 1.1 기본 기능
- [x] Chrome Side Panel API를 활용한 패널 구현
- [x] 워크플로우 실행 중 자동 오픈
- [x] 실시간 상태 업데이트
- [x] 사용자 액션 버튼 제공

#### 1.2 UI 요구사항
- [x] 너비: Chrome 기본 사이드패널 너비 (약 400px)
- [x] 반응형 레이아웃
- [ ] 접근성 준수 (ARIA labels, keyboard navigation)

### 2. 상태 확인 플로우

#### 2.1 로그인 상태 확인 예시
```
1. 워크플로우에서 "check-status" 블록 실행
2. 사이드패널 자동 오픈
3. "로그인 상태 확인 중..." 메시지 표시
4. [확인] 버튼 활성화
5. 사용자 액션 처리:
   - 성공 시: 계정 정보 표시 + 워크플로우 계속
   - 실패 시: 재시도 안내 + 대기
6. [닫기] 버튼으로 최소화
```

#### 2.2 지원할 상태 확인 유형
- [ ] 로그인 상태
- [ ] 페이지 로딩 완료
- [ ] 특정 요소 출현
- [ ] 커스텀 조건

### 3. 플로팅 버튼

#### 3.1 기본 기능
- [ ] 사이드패널 최소화 시 표시
- [ ] 오른쪽 하단 고정 위치
- [ ] 클릭 시 사이드패널 재오픈

#### 3.2 UI 요구사항
- [ ] 크기: 50x50px 원형 버튼
- [ ] 상태 표시 아이콘
- [ ] 호버 효과 및 툴팁
- [ ] 드래그 가능 (옵션)

## 🏗️ 기술 구현 사항

### 1. 새로운 컴포넌트

#### 1.1 CheckStatusBlock (`src/blocks/CheckStatusBlock.ts`)
```typescript
interface CheckStatusBlock {
  name: 'check-status'
  checkType: 'login' | 'pageLoad' | 'element' | 'custom'
  title: string
  description?: string
  options: {
    timeoutMs?: number
    retryable?: boolean
    customValidator?: string // JavaScript expression
  }
}
```

#### 1.2 SidePanel 컴포넌트 (`src/sidepanel/`)
```
src/sidepanel/
├── index.html          # 사이드패널 엔트리
├── main.tsx           # React 앱 초기화
├── App.tsx            # 메인 컴포넌트
├── components/
│   ├── StatusChecker.tsx
│   ├── LoginStatus.tsx
│   └── ActionButtons.tsx
└── styles/
    └── sidepanel.css
```

#### 1.3 FloatingButton 컴포넌트 (`src/content/components/FloatingButton.tsx`)
- Content Script에 주입
- Shadow DOM 사용으로 스타일 격리
- 위치 충돌 방지 로직

### 2. 메시지 통신 아키텍처

#### 2.1 새로운 메시지 타입
```typescript
// Internal Messages
interface OpenSidePanelMessage {
  type: 'OPEN_SIDE_PANEL'
  payload: {
    checkType: string
    title: string
    description?: string
  }
}

interface SidePanelActionMessage {
  type: 'SIDE_PANEL_ACTION'
  payload: {
    action: 'confirm' | 'cancel' | 'retry'
    data?: any
  }
}

interface UpdateSidePanelMessage {
  type: 'UPDATE_SIDE_PANEL'
  payload: {
    status: 'checking' | 'success' | 'error' | 'waiting'
    message: string
    data?: any
  }
}
```

#### 2.2 통신 플로우
```
Workflow Runner
    ↓ (CheckStatusBlock 실행)
Background Service
    ↓ (chrome.sidePanel.open())
Side Panel
    ↓ (사용자 인터랙션)
Background Service
    ↓ (결과 전달)
Workflow Runner (계속/중단)
```

### 3. Background 서비스 확장

#### 3.1 SidePanelService (`src/background/service/SidePanelService.ts`)
- [ ] Side Panel API 관리
- [ ] 상태 동기화
- [ ] 메시지 라우팅
- [ ] 타임아웃 처리

#### 3.2 Manifest 업데이트
```json
{
  "permissions": [
    "sidePanel"
  ],
  "side_panel": {
    "default_path": "sidepanel/index.html"
  }
}
```

## 📝 구현 태스크

### Phase 1: 기본 인프라 (2-3일)
- [x] Manifest.json에 sidePanel 권한 추가
- [x] 사이드패널 HTML/React 기본 구조 생성
- [x] Vite 빌드 설정 업데이트 (사이드패널 엔트리 추가)
- [x] 기본 메시지 통신 구현

### Phase 2: 핵심 기능 (3-4일)
- [x] CheckStatusBlock 구현
- [x] SidePanelService 구현
- [x] 사이드패널 UI 컴포넌트 개발
- [ ] 워크플로우 런너 연동

### Phase 3: 사용자 경험 개선 (2-3일)
- [ ] FloatingButton 구현
- [ ] 애니메이션 및 전환 효과
- [ ] 에러 처리 및 재시도 로직
- [ ] 상태별 UI 피드백

### Phase 4: 통합 및 최적화 (1-2일)
- [ ] StatusUI와 위치 충돌 해결
- [ ] 성능 최적화
- [ ] 엣지 케이스 처리
- [ ] 문서화

## 🔄 워크플로우 예시

### 로그인 후 데이터 수집 워크플로우
```typescript
{
  version: '1.0',
  start: 'navigate-login',
  steps: [
    {
      id: 'navigate-login',
      block: {
        name: 'navigate',
        url: 'https://example.com/login'
      },
      next: 'check-login'
    },
    {
      id: 'check-login',
      block: {
        name: 'check-status',
        checkType: 'login',
        title: '로그인 상태 확인',
        description: '로그인이 완료되었는지 확인해주세요',
        options: {
          timeoutMs: 60000,
          retryable: true
        }
      },
      onSuccess: 'collect-data',
      onFailure: 'login-failed'
    },
    {
      id: 'collect-data',
      block: {
        name: 'get-text',
        selector: '.user-data',
        findBy: 'cssSelector'
      }
    }
  ]
}
```

## 🚨 주의사항 및 제약사항

1. **Chrome 버전 호환성**
   - Chrome 114+ 필요 (Side Panel API)
   - Manifest V3 필수

2. **UI/UX 고려사항**
   - StatusUI와 플로팅 버튼 위치 충돌 방지
   - 여러 탭에서 동시 실행 시 처리
   - 사이드패널 강제 종료 시 처리

3. **성능 고려사항**
   - 메시지 통신 최적화
   - 불필요한 리렌더링 방지
   - 메모리 누수 방지

4. **보안 고려사항**
   - 민감한 정보 표시 주의
   - XSS 방지
   - 사용자 입력 검증

## 📊 성공 지표

- [ ] 사이드패널 오픈 응답시간 < 500ms
- [ ] 사용자 액션 처리 시간 < 100ms
- [ ] 워크플로우 중단 없는 원활한 전환
- [ ] 직관적인 UI로 학습 시간 최소화

## 🔗 참고 자료

- [Chrome Side Panel API Documentation](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- 기존 구현 참고: `src/content/components/ConfirmationUI.tsx`

## 📁 현재까지 구현된 주요 파일

### 사이드패널 컴포넌트
- `src/sidepanel/index.html` - 사이드패널 엔트리 포인트
- `src/sidepanel/main.tsx` - React 앱 초기화
- `src/sidepanel/App.tsx` - 메인 앱 컴포넌트
- `src/sidepanel/types.ts` - TypeScript 타입 정의
- `src/sidepanel/components/StatusChecker.tsx` - 상태 체크 UI
- `src/sidepanel/components/LoginStatus.tsx` - 로그인 상태 UI
- `src/sidepanel/components/ActionButtons.tsx` - 액션 버튼 UI
- `src/sidepanel/styles/sidepanel.css` - 스타일시트

### 백그라운드 서비스
- `src/background/service/SidePanelService.ts` - 사이드패널 관리 서비스
- `src/background/chrome/BackgroundManager.ts` - SidePanelService 통합

### 블록 구현
- `src/blocks/CheckStatusBlock.ts` - check-status 블록 구현
- `src/blocks/index.ts` - CheckStatusBlock 통합

### 컨텐트 스크립트
- `src/content/handler/InternalMessageHandler.ts` - CHECK_STATUS 메시지 핸들러 추가

### 설정 파일
- `manifest.config.ts` - sidePanel 권한 및 설정 추가

## 📅 예상 일정

- **전체 소요 시간**: 8-12일
- **MVP 완성**: 5-7일
- **개선 및 최적화**: 3-5일

---

*작성일: 2025년 11월*  
*최종 수정일: 2025년 11월 20일*  
*작성자: 8G Extension Team*  
*버전: 1.0.1*  
*구현 상태: Phase 1 완료, Phase 2 진행 중*