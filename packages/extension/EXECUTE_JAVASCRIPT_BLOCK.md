# Execute JavaScript Block

`execute-javascript` 블록은 웹 페이지에서 임의의 JavaScript 코드를 실행할 수 있는 블록입니다. CDP(Chrome DevTools Protocol)의 `Runtime.evaluate`를 사용하여 코드를 실행합니다.

## 블록 스키마

```typescript
interface ExecuteJavaScriptBlock {
  name: 'execute-javascript';
  // 실행할 JavaScript 코드 (필수)
  code: string;
  // 코드 실행 결과를 반환할지 여부 (기본값: true)
  returnResult?: boolean;
  // 실행 타임아웃 ms (기본값: 30000)
  timeout?: number;
}
```

## 기본 사용법

```typescript
{
  id: 'runScript',
  block: {
    name: 'execute-javascript',
    code: `
      const title = document.querySelector('h1').textContent;
      return title;
    `,
  },
}
```

## 내장 헬퍼 함수

`execute-javascript` 블록에서는 다음 헬퍼 함수들을 글로벌로 사용할 수 있습니다.

### `wait(ms)`

지정된 밀리초 동안 대기합니다.

**시그니처:**
```typescript
wait(ms: number): Promise<void>
```

**예시:**
```javascript
// 1초 대기
await wait(1000);

// 클릭 후 애니메이션 대기
document.querySelector('.button').click();
await wait(500);
```

### `waitForElement(selector, options?)`

CSS 선택자에 해당하는 요소가 DOM에 나타날 때까지 대기합니다.

**시그니처:**
```typescript
waitForElement(
  selector: string,
  options?: {
    timeout?: number;   // 최대 대기 시간 ms (기본값: 10000)
    interval?: number;  // 체크 간격 ms (기본값: 100)
    visible?: boolean;  // 요소가 실제로 보일 때까지 대기 (기본값: false)
  }
): Promise<Element>
```

**옵션 설명:**
| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `timeout` | number | 10000 | 요소를 찾을 때까지 최대 대기 시간 (ms) |
| `interval` | number | 100 | 요소 존재 여부를 체크하는 간격 (ms) |
| `visible` | boolean | false | `true`일 경우 요소가 화면에 실제로 보일 때까지 대기 |

**visible 옵션 상세:**

`visible: true`로 설정하면 다음 조건을 모두 만족할 때 요소가 "보인다"고 판단합니다:
- `width > 0` 및 `height > 0`
- `visibility !== 'hidden'`
- `display !== 'none'`
- `opacity !== '0'`

**예시:**
```javascript
// 기본 사용 (DOM에 존재하면 즉시 반환)
const modal = await waitForElement('.modal');

// 5초 타임아웃 설정
const button = await waitForElement('#submit-btn', { timeout: 5000 });

// 요소가 실제로 보일 때까지 대기
const popup = await waitForElement('.popup', { visible: true });

// 모든 옵션 사용
const element = await waitForElement('.dynamic-content', {
  timeout: 15000,
  interval: 200,
  visible: true,
});
```

## 실전 예제

### 예제 1: 동적 콘텐츠 대기 후 데이터 추출

```typescript
{
  id: 'extractAfterLoad',
  block: {
    name: 'execute-javascript',
    code: `
      // 로딩 스피너가 사라질 때까지 대기
      await waitForElement('.content-loaded', { visible: true });

      // 데이터 추출
      const items = Array.from(document.querySelectorAll('.item'));
      return items.map(item => ({
        title: item.querySelector('.title')?.textContent,
        price: item.querySelector('.price')?.textContent,
      }));
    `,
    timeout: 60000,
  },
}
```

### 예제 2: 순차적 클릭 및 대기

```typescript
{
  id: 'clickSequence',
  block: {
    name: 'execute-javascript',
    code: `
      // 첫 번째 버튼 클릭
      document.querySelector('.step1-btn').click();
      await wait(300);

      // 모달이 나타날 때까지 대기
      const modal = await waitForElement('.modal', { visible: true });

      // 모달 내 확인 버튼 클릭
      modal.querySelector('.confirm-btn').click();
      await wait(500);

      // 결과 확인
      const result = await waitForElement('.result-message', { timeout: 5000 });
      return result.textContent;
    `,
  },
}
```

### 예제 3: 무한 스크롤 페이지에서 데이터 수집

```typescript
{
  id: 'infiniteScrollCollect',
  block: {
    name: 'execute-javascript',
    code: `
      const items = [];
      let prevCount = 0;

      while (items.length < 100) {
        // 현재 아이템 수집
        const currentItems = document.querySelectorAll('.item');
        currentItems.forEach(item => {
          const id = item.dataset.id;
          if (!items.find(i => i.id === id)) {
            items.push({
              id,
              text: item.textContent,
            });
          }
        });

        // 더 이상 새 아이템이 없으면 종료
        if (items.length === prevCount) break;
        prevCount = items.length;

        // 스크롤 다운
        window.scrollTo(0, document.body.scrollHeight);
        await wait(1000);

        // 로딩 완료 대기
        await waitForElement('.item:last-child', { timeout: 5000 }).catch(() => {});
      }

      return items;
    `,
    timeout: 120000,
  },
}
```

### 예제 4: 폼 자동 입력

```typescript
{
  id: 'fillForm',
  block: {
    name: 'execute-javascript',
    code: `
      // 폼이 로드될 때까지 대기
      const form = await waitForElement('form#signup', { visible: true });

      // 입력 필드 채우기
      const nameInput = form.querySelector('input[name="name"]');
      nameInput.value = 'John Doe';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      await wait(100);

      const emailInput = form.querySelector('input[name="email"]');
      emailInput.value = 'john@example.com';
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      await wait(100);

      // 제출 버튼 활성화 대기
      await waitForElement('button[type="submit"]:not([disabled])', {
        timeout: 3000,
        visible: true,
      });

      return { success: true };
    `,
  },
}
```

## 워크플로우 예제

```typescript
const workflow = {
  version: '1.0',
  start: 'navigate',
  steps: [
    {
      id: 'navigate',
      block: {
        name: 'navigate',
        url: 'https://example.com/products',
        waitUntil: 'networkidle',
      },
      next: 'waitAndExtract',
    },
    {
      id: 'waitAndExtract',
      block: {
        name: 'execute-javascript',
        code: `
          // 상품 목록 로딩 대기
          await waitForElement('.product-grid', { visible: true });
          await wait(500);

          // 상품 정보 추출
          const products = Array.from(document.querySelectorAll('.product-card'));
          return products.map(p => ({
            name: p.querySelector('.product-name')?.textContent?.trim(),
            price: p.querySelector('.product-price')?.textContent?.trim(),
            image: p.querySelector('img')?.src,
          }));
        `,
        timeout: 30000,
      },
    },
  ],
};
```

## 주의사항

1. **비동기 코드**: 코드는 자동으로 async 함수로 래핑되므로 `await`를 자유롭게 사용할 수 있습니다.

2. **타임아웃**: `waitForElement`의 `timeout`과 블록의 `timeout`은 별개입니다. 블록의 `timeout`이 전체 실행 시간을 제한합니다.

3. **에러 처리**: `waitForElement`가 타임아웃되면 에러를 throw합니다. 필요시 try-catch로 감싸세요.
   ```javascript
   try {
     const el = await waitForElement('.optional-element', { timeout: 3000 });
     // 요소가 있을 때 처리
   } catch (e) {
     // 요소가 없을 때 처리
   }
   ```

4. **반환값**: `return` 문으로 값을 반환하면 워크플로우의 다음 단계에서 `steps.{stepId}.result.data`로 접근할 수 있습니다.

5. **selector/findBy/option 불필요**: 이 블록은 selector, findBy, option 필드가 필요 없습니다.
