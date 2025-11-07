# Export Data Block 사용 가이드

`export-data` 블록을 사용하면 크롤링한 데이터를 JSON, CSV, 또는 Excel(XLSX) 파일로 저장할 수 있습니다.

## 기본 사용법

### JSON으로 내보내기

```typescript
import { EightGClient } from '8g-extension';

const client = new EightGClient();

const workflow = {
  version: '1.0',
  start: 'scrapeData',
  steps: [
    {
      id: 'scrapeData',
      block: {
        name: 'get-element-data',
        selector: '.product-item',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          name: { selector: '.product-name', type: 'text' },
          price: { selector: '.product-price', type: 'text' },
          url: { selector: 'a', type: 'attribute', attribute: 'href' },
        },
      },
      next: 'exportJson',
    },
    {
      id: 'exportJson',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeData.result.data' },
        format: 'json',
        filename: 'products',
      },
    },
  ],
};

const result = await client.collectWorkflow({
  targetUrl: 'https://example.com/products',
  workflow,
});

console.log('Exported:', result.steps[1].result.data.filename);
// Output: products.json
```

### CSV로 내보내기

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeUsers',
  steps: [
    {
      id: 'scrapeUsers',
      block: {
        name: 'get-element-data',
        selector: '.user-row',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          name: { selector: '.user-name', type: 'text' },
          email: { selector: '.user-email', type: 'text' },
          role: { selector: '.user-role', type: 'text' },
        },
      },
      next: 'exportCsv',
    },
    {
      id: 'exportCsv',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeUsers.result.data' },
        format: 'csv',
        filename: 'users',
        csvOptions: {
          delimiter: ',',
          includeHeaders: true,
        },
      },
    },
  ],
};
```

### Excel(XLSX)로 내보내기

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeInventory',
  steps: [
    {
      id: 'scrapeInventory',
      block: {
        name: 'get-element-data',
        selector: '.inventory-item',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          product: { selector: '.product-name', type: 'text' },
          sku: { selector: '.sku', type: 'text' },
          quantity: { selector: '.quantity', type: 'text' },
          price: { selector: '.price', type: 'text' },
        },
      },
      next: 'exportExcel',
    },
    {
      id: 'exportExcel',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeInventory.result.data' },
        format: 'xlsx',
        filename: 'inventory',
      },
    },
  ],
};
```

## 고급 사용법

### transform-data와 함께 사용

데이터를 변환한 후 내보내기:

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeOrders',
  steps: [
    {
      id: 'scrapeOrders',
      block: {
        name: 'get-element-data',
        selector: '.order-item',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          orderId: { selector: '.order-id', type: 'text' },
          amount: { selector: '.amount', type: 'text' },
          status: { selector: '.status', type: 'text' },
        },
      },
      next: 'transformData',
    },
    {
      id: 'transformData',
      block: {
        name: 'transform-data',
        sourceData: { valueFrom: 'steps.scrapeOrders.result.data' },
        expression: `
          $map($, function($order) {
            {
              "orderId": $order.orderId,
              "amount": $number($replace($order.amount, /[^0-9.]/g, "")),
              "status": $order.status,
              "processedAt": $now()
            }
          })
        `,
      },
      next: 'exportTransformed',
    },
    {
      id: 'exportTransformed',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.transformData.result.data' },
        format: 'json',
        filename: 'processed-orders',
      },
    },
  ],
};
```

### 반복 수집 후 내보내기

여러 페이지를 크롤링하고 결과를 하나의 파일로 내보내기:

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeMultiplePages',
  vars: {
    allProducts: [],
  },
  steps: [
    {
      id: 'scrapeMultiplePages',
      block: {
        name: 'get-element-data',
        selector: '.product',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          name: { selector: '.name', type: 'text' },
          price: { selector: '.price', type: 'text' },
        },
      },
      repeat: {
        count: 5, // 5 페이지 수집
        delayBetween: 1000,
      },
      next: 'exportAll',
    },
    {
      id: 'exportAll',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeMultiplePages.result.data' },
        format: 'xlsx',
        filename: 'all-products',
      },
    },
  ],
};
```

### 조건부 내보내기

데이터가 있을 때만 내보내기:

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeData',
  steps: [
    {
      id: 'scrapeData',
      block: {
        name: 'get-element-data',
        selector: '.data-item',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          value: { selector: '.value', type: 'text' },
        },
      },
      next: 'checkData',
    },
    {
      id: 'checkData',
      when: {
        exists: 'steps.scrapeData.result.data[0]',
      },
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeData.result.data' },
        format: 'csv',
        filename: 'data-export',
      },
    },
  ],
};
```

### 여러 형식으로 동시에 내보내기

```typescript
const workflow = {
  version: '1.0',
  start: 'scrapeData',
  steps: [
    {
      id: 'scrapeData',
      block: {
        name: 'get-element-data',
        selector: '.item',
        findBy: 'cssSelector',
        option: { multiple: true },
        dataConfig: {
          title: { selector: '.title', type: 'text' },
          description: { selector: '.desc', type: 'text' },
        },
      },
      switch: [{ when: { exists: 'steps.scrapeData.result.data' }, next: 'exportJson' }],
    },
    {
      id: 'exportJson',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeData.result.data' },
        format: 'json',
        filename: 'data-backup',
      },
      next: 'exportCsv',
    },
    {
      id: 'exportCsv',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeData.result.data' },
        format: 'csv',
        filename: 'data-report',
      },
      next: 'exportExcel',
    },
    {
      id: 'exportExcel',
      block: {
        name: 'export-data',
        data: { valueFrom: 'steps.scrapeData.result.data' },
        format: 'xlsx',
        filename: 'data-analysis',
      },
    },
  ],
};
```

## CSV 옵션

### 커스텀 구분자 사용

```typescript
{
  id: 'exportCsv',
  block: {
    name: 'export-data',
    data: { valueFrom: 'steps.getData.result.data' },
    format: 'csv',
    filename: 'data',
    csvOptions: {
      delimiter: ';',  // 세미콜론 구분자
      includeHeaders: true
    }
  }
}
```

### 헤더 없이 내보내기

```typescript
{
  id: 'exportCsvNoHeaders',
  block: {
    name: 'export-data',
    data: { valueFrom: 'steps.getData.result.data' },
    format: 'csv',
    filename: 'data-no-headers',
    csvOptions: {
      includeHeaders: false
    }
  }
}
```

## 파일명 처리

- 파일명에 확장자가 없으면 자동으로 추가됩니다.
- 파일명을 지정하지 않으면 `export-data.[format]`이 사용됩니다.
- 파일은 브라우저의 기본 다운로드 폴더에 저장됩니다.

```typescript
// 확장자 자동 추가
filename: 'myfile'; // → myfile.json

// 확장자가 있으면 유지
filename: 'myfile.csv'; // → myfile.csv

// 파일명 없음
// → export-data.json
```

## 타입 정의

```typescript
interface ExportDataBlock {
  name: 'export-data';
  data: any; // 저장할 데이터 (바인딩 가능)
  format: 'json' | 'csv' | 'xlsx'; // 파일 형식
  filename?: string; // 파일명 (선택사항, 기본값: 'export-data')
  csvOptions?: {
    delimiter?: string; // CSV 구분자 (기본값: ',')
    includeHeaders?: boolean; // 헤더 포함 여부 (기본값: true)
  };
}
```

## 주의사항

1. **데이터 형식**:
   - JSON: 모든 데이터 타입 지원
   - CSV/XLSX: 객체 배열이 가장 적합하며, 중첩 객체는 문자열로 변환됨

2. **파일 크기**:
   - 매우 큰 데이터셋의 경우 브라우저 메모리 제한을 고려해야 합니다.

3. **권한**:
   - Chrome Downloads API 권한이 manifest에 포함되어 있어야 합니다.

4. **Excel 형식**:
   - XLSX 파일은 SpreadsheetML 형식으로 생성되며, Excel 및 LibreOffice에서 열 수 있습니다.

## 결과 확인

```typescript
const result = await client.collectWorkflow({
  targetUrl: 'https://example.com',
  workflow,
});

// 내보내기 결과 확인
const exportStep = result.steps.find((s) => s.id === 'exportData');
console.log('Downloaded file:', exportStep.result.data.filename);
console.log('Download ID:', exportStep.result.data.downloadId);
```
