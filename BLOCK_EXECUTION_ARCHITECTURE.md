# 8G Extension 블록 실행 아키텍처 분석

## 개요
8G Extension은 웹페이지에서 데이터를 수집하기 위한 Chrome Extension입니다. 이 문서는 현재 블록(Block) 실행 구조와 **구현 완료된** blockList 순차 실행 기능을 설명합니다.

## 현재 아키텍처

### 1. 진입점: SDK (src/sdk/)
```
src/sdk/
├── index.ts              # SDK 진입점
├── EightGClient.ts       # 메인 클라이언트 클래스
├── types.ts             # SDK 타입 정의
└── errors.ts            # 에러 처리
```

**EightGClient 클래스의 주요 메서드:**
- `checkExtension()`: 확장 프로그램 설치 확인
- `collectData(request)`: 단일 블록 또는 블록 배열 실행 요청 (순차 실행 지원)

### 2. 메시지 흐름

#### 2.1 외부 메시지 (Webpage ↔ Content Script)
```typescript
// 외부 메시지 타입들
interface CollectDataMessage {
  type: '8G_COLLECT_DATA';
  requestId: string;
  targetUrl: string;
  block: Block | Block[];          // 단일 블록 또는 블록 배열 지원
  closeTabAfterCollection?: boolean;
  activateTab?: boolean;
  blockDelay?: number;             // 블록 간 지연 시간 (ms) - 기본값: 500ms
}
```

#### 2.2 내부 메시지 (Content Script ↔ Background)
```typescript
interface CollectDataNewTabMessage {
  type: 'COLLECT_DATA_NEW_TAB';
  data: {
    targetUrl: string;
    block: Block | Block[];        // 단일 블록 또는 블록 배열 지원
    closeTabAfterCollection?: boolean;
    activateTab?: boolean;
    blockDelay?: number;           // 블록 간 지연 시간 (ms) - 기본값: 500ms
  };
}
```

### 3. 실행 흐름

#### 3.1 단일 블록 실행
```
1. 웹페이지 → EightGClient.collectData({ block: Block })
2. SDK → window.postMessage('8G_COLLECT_DATA')
3. Content Script → ExternalMessageHandler
4. Content Script → BackgroundManager (chrome.runtime.sendMessage)
5. Background → 새 탭 생성 (TabManager)
6. Background → Content Script에 블록 실행 요청
7. Content Script → BlockHandler.executeBlock()
8. 결과 역순으로 반환
```

#### 3.2 블록 배열 순차 실행
```
1. 웹페이지 → EightGClient.collectData({ block: Block[], blockDelay: number })
2. SDK → window.postMessage('8G_COLLECT_DATA')
3. Content Script → ExternalMessageHandler
4. Content Script → BackgroundManager (chrome.runtime.sendMessage)
5. Background → 새 탭 생성 (TabManager)
6. Background → stepExecuteBlockList() 호출
7. 각 블록을 순차적으로 실행 (설정된 지연 시간 간격)
8. 모든 블록 결과를 배열로 수집
9. 결과 역순으로 반환
```

### 4. 블록 실행 구조

#### 4.1 BlockHandler (src/blocks/index.ts)
```typescript
export class BlockHandler {
  static async executeBlock(block: Block): Promise<BlockResult> {
    switch (block.name) {
      case 'get-text': return await handlerGetText(validatedBlock);
      case 'attribute-value': return await handlerGetAttributeValue(validatedBlock);
      case 'get-value-form': return await handlerGetValueForm(validatedBlock);
      case 'set-value-form': return await handlerSetValueForm(validatedBlock);
      case 'clear-value-form': return await handlerClearValueForm(validatedBlock);
      case 'element-exists': return await handlerElementExists(validatedBlock);
      case 'event-click': return await handlerEventClick(validatedBlock);
      case 'save-assets': return await handlerSaveAssets(validatedBlock);
      case 'get-element-data': return await handlerGetElementData(validatedBlock);
      default: return { hasError: true, message: `Unknown block type: ${block.name}` };
    }
  }
}
```

#### 4.2 지원되는 블록 타입들
- `get-text`: 텍스트 추출
- `attribute-value`: 속성 값 추출
- `get-value-form`: 폼 값 가져오기
- `set-value-form`: 폼 값 설정
- `clear-value-form`: 폼 값 지우기
- `element-exists`: 요소 존재 확인
- `event-click`: 클릭 이벤트 발생
- `save-assets`: 에셋 저장
- `get-element-data`: 요소 데이터 추출

## 구현된 BlockList 순차 실행 기능

### ✅ 완료된 구현사항

#### 1. 타입 정의 확장 (완료)
```typescript
// CollectDataRequest 타입 확장
interface CollectDataRequest {
  targetUrl: string;
  block: Block | Block[];              // 단일 블록 또는 블록 배열 지원
  blockDelay?: number;                 // 블록 간 지연 시간 (ms) - 기본값: 500ms
}

// CollectDataResult 타입 확장
interface CollectDataResult<T = any> {
  success: boolean;
  data?: BackgroundStepResponse<T> | BackgroundStepResponse<T>[]; // 단일 또는 배열 결과
  error?: string;
  timestamp: string;
  targetUrl: string;
}
```

#### 2. SDK 클라이언트 확장 (완료)
```typescript
// EightGClient 오버로드 추가
export class EightGClient {
  // 단일 블록 오버로드들 (기존)
  async collectData(request: { targetUrl: string; block: GetTextBlock }): Promise<CollectDataResult<string | string[]>>;
  // ... 기타 단일 블록 오버로드들
  
  // 블록 배열 오버로드 (신규)
  async collectData(request: { targetUrl: string; block: Block[] }): Promise<CollectDataResult<any[]>>;
  
  // 제네릭 오버로드
  async collectData(request: CollectDataRequest): Promise<CollectDataResult>;
}
```

#### 3. BackgroundManager 확장 (완료)
```typescript
// BackgroundManager에 구현된 블록 배열 처리 로직
private async stepExecuteBlock(
  requestData: CollectDataNewTabMessage['data'],
  tab: chrome.tabs.Tab
): Promise<BackgroundStepResponse<any>> {
  // 단일 블록인지 배열인지 확인
  if (Array.isArray(requestData.block)) {
    // 여러 블록 순차 실행 (설정 가능한 지연 시간)
    const blockDelay = requestData.blockDelay || 500; // 기본값 500ms
    const blockResults = await this.stepExecuteBlockList(requestData.block, tab.id!, blockDelay);
    
    return {
      success: true,
      targetUrl: requestData.targetUrl,
      tabId: tab.id!,
      result: blockResults,
      timestamp: new Date().toISOString(),
      closeTabAfterCollection: requestData.closeTabAfterCollection !== false,
    };
  } else {
    // 단일 블록 실행 (기존 로직)
    const blockResult = await this.tabManager.executeBlock(requestData.block, tab.id!);
    return { /* ... */ };
  }
}

// 블록 배열을 순차적으로 실행하는 메서드
private async stepExecuteBlockList(
  blocks: any[],
  tabId: number,
  blockDelay: number = 500
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`[8G Background] Executing block ${i + 1}/${blocks.length}:`, block.name);
    
    try {
      const result = await this.tabManager.executeBlock(block, tabId);
      results.push(result);
      
      // 블록 실행 후 대기 (DOM 업데이트 등) - 설정 가능한 지연 시간
      if (i < blocks.length - 1 && blockDelay > 0) {
        console.log(`[8G Background] Waiting ${blockDelay}ms before next block...`);
        await new Promise(resolve => setTimeout(resolve, blockDelay));
      }
      
      // 에러 발생 시 중단할지 결정 (현재는 계속 진행)
      if (result.hasError) {
        console.warn(`[8G Background] Block ${i + 1} failed but continuing:`, result.message);
      }
    } catch (error) {
      console.error(`[8G Background] Block ${i + 1} execution error:`, error);
      results.push({
        hasError: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      });
    }
  }
  
  return results;
}
```

#### 4. 메시지 핸들러 확장 (완료)
```typescript
// ExternalMessageHandler에서 blockDelay 전달
private async handleCollectData(message: CollectDataMessage): Promise<void> {
  const backgroundMessage: CollectDataNewTabMessage = {
    type: 'COLLECT_DATA_NEW_TAB',
    data: {
      targetUrl: message.targetUrl,
      block: message.block,
      closeTabAfterCollection: message.closeTabAfterCollection !== false,
      activateTab: message.activateTab === true,
      blockDelay: message.blockDelay || 500, // 기본값 500ms
    },
  };
  // ... 나머지 로직
}
```

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
