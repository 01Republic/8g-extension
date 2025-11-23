/**
 * ExportDataService
 *
 * Background에서 Chrome Downloads API를 사용하여 데이터를 파일로 내보냅니다.
 */

/**
 * 데이터를 JSON 문자열로 변환
 */
function dataToJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 데이터를 CSV 문자열로 변환
 */
function dataToCsv(data: any, options?: { delimiter?: string; includeHeaders?: boolean }): string {
  const delimiter = options?.delimiter || ',';
  const includeHeaders = options?.includeHeaders !== false;

  // 배열이 아니면 배열로 변환
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    return '';
  }

  // 모든 키 수집
  const allKeys = new Set<string>();
  items.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((key) => allKeys.add(key));
    }
  });

  const keys = Array.from(allKeys);
  const lines: string[] = [];

  // 헤더 추가
  if (includeHeaders && keys.length > 0) {
    lines.push(keys.map((key) => escapeCsvValue(key, delimiter)).join(delimiter));
  }

  // 데이터 행 추가
  items.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      const values = keys.map((key) => {
        const value = item[key];
        return escapeCsvValue(value, delimiter);
      });
      lines.push(values.join(delimiter));
    } else {
      // 원시 타입인 경우
      lines.push(escapeCsvValue(item, delimiter));
    }
  });

  return lines.join('\n');
}

/**
 * CSV 값 이스케이프 처리
 */
function escapeCsvValue(value: any, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // 구분자, 따옴표, 개행 문자가 포함되어 있으면 따옴표로 감싸고 내부 따옴표는 이중으로
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * 데이터를 Excel (XLSX) 형식으로 변환
 * SpreadsheetML XML 형식으로 생성하여 Excel에서 열 수 있도록 합니다.
 */
function dataToXlsx(data: any): string {
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    return createSpreadsheetXml([]);
  }

  // 모든 키 수집
  const allKeys = new Set<string>();
  items.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((key) => allKeys.add(key));
    }
  });

  const keys = Array.from(allKeys);
  const rows: any[][] = [];

  // 헤더 행 추가
  if (keys.length > 0) {
    rows.push(keys);
  }

  // 데이터 행 추가
  items.forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      const row = keys.map((key) => item[key]);
      rows.push(row);
    } else {
      rows.push([item]);
    }
  });

  return createSpreadsheetXml(rows);
}

/**
 * SpreadsheetML XML 생성 (Excel이 열 수 있는 형식)
 */
function createSpreadsheetXml(rows: any[][]): string {
  const xmlRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const cellValue = cell === null || cell === undefined ? '' : String(cell);
          const escapedValue = escapeXml(cellValue);
          return `   <Cell><Data ss:Type="String">${escapedValue}</Data></Cell>`;
        })
        .join('\n');
      return `  <Row>\n${cells}\n  </Row>`;
    })
    .join('\n');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sheet1">
  <Table>
${xmlRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * XML 특수 문자 이스케이프
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * ExportDataService
 */
export class ExportDataService {
  /**
   * 데이터를 파일로 내보내기
   */
  static async exportData(params: {
    data: any;
    format: 'json' | 'csv' | 'xlsx';
    filename?: string;
    csvOptions?: {
      delimiter?: string;
      includeHeaders?: boolean;
    };
  }): Promise<{ filename: string; downloadId: number }> {
    const { data, format, filename = 'export-data', csvOptions } = params;

    if (data === undefined || data === null) {
      throw new Error('No data provided for export');
    }

    let content: string;
    let finalFilename: string;
    let mimeType: string;

    // 형식별 변환
    switch (format) {
      case 'json':
        content = dataToJson(data);
        finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = dataToCsv(data, csvOptions);
        finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;

      case 'xlsx':
        content = dataToXlsx(data);
        finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
        mimeType = 'application/vnd.ms-excel';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // 데이터를 Data URL로 변환
    const blob = new Blob([content], { type: mimeType });
    const dataUrl = await this.blobToDataUrl(blob);

    // Chrome Downloads API로 다운로드
    const downloadId = await new Promise<number>((resolve, reject) => {
      chrome.downloads.download(
        {
          url: dataUrl,
          filename: finalFilename,
          saveAs: false, // 자동으로 다운로드 폴더에 저장
        },
        (id) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(id);
          }
        }
      );
    });

    return {
      filename: finalFilename,
      downloadId,
    };
  }

  /**
   * Blob을 Data URL로 변환
   */
  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
