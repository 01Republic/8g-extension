import z from 'zod';
import { Block, BlockResult } from './types';

/**
 * ExportData Block
 *
 * 크롤링한 데이터를 JSON, CSV, 또는 Excel 파일로 저장합니다.
 * Chrome Downloads API를 사용하여 파일을 다운로드합니다.
 *
 * 사용 예:
 * {
 *   name: 'export-data',
 *   data: { valueFrom: 'steps.getItems.result.data' },
 *   format: 'json',
 *   filename: 'export-data'
 * }
 */
export interface ExportDataBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'export-data';
  data: any; // 저장할 데이터 (바인딩 가능)
  format: 'json' | 'csv' | 'xlsx'; // 파일 형식
  filename?: string; // 파일명 (기본값: 'export-data')
  // CSV 전용 옵션
  csvOptions?: {
    delimiter?: string; // 구분자 (기본값: ',')
    includeHeaders?: boolean; // 헤더 포함 여부 (기본값: true)
  };
}

// ExportData 블록용 스키마 (검증용)
export const ExportDataBlockSchema = z.object({
  name: z.literal('export-data'),
  data: z.any(),
  format: z.enum(['json', 'csv', 'xlsx']),
  filename: z.string().optional(),
  csvOptions: z.object({
    delimiter: z.string().optional(),
    includeHeaders: z.boolean().optional(),
  }).optional(),
});

export function validateExportDataBlock(data: unknown): ExportDataBlock {
  return ExportDataBlockSchema.parse(data) as ExportDataBlock;
}

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
  items.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });

  const keys = Array.from(allKeys);
  const lines: string[] = [];

  // 헤더 추가
  if (includeHeaders && keys.length > 0) {
    lines.push(keys.map(key => escapeCsvValue(key, delimiter)).join(delimiter));
  }

  // 데이터 행 추가
  items.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      const values = keys.map(key => {
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
 * 참고: 실제로는 간단한 XML 기반 XLSX를 생성합니다.
 * 더 복잡한 경우 xlsx 라이브러리 사용을 권장하지만, 의존성 최소화를 위해 기본 구현 제공
 */
async function dataToXlsx(data: any): Promise<Blob> {
  // xlsx 라이브러리가 있으면 사용, 없으면 CSV로 폴백
  try {
    // @ts-ignore - xlsx는 선택적 의존성
    const XLSX = await import('xlsx');

    const items = Array.isArray(data) ? data : [data];
    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // XLSX를 binary string으로 변환
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    // xlsx 라이브러리가 없으면 CSV로 폴백
    console.warn('xlsx library not found, falling back to CSV format');
    const csvContent = dataToCsv(data);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}

/**
 * ExportData 블록 핸들러
 *
 * 데이터를 지정된 형식으로 변환하고 Chrome Downloads API를 통해 다운로드합니다.
 */
export async function handlerExportData(block: ExportDataBlock): Promise<BlockResult<{ filename: string; downloadId?: number }>> {
  try {
    const { data, format, filename = 'export-data', csvOptions } = block;

    if (data === undefined || data === null) {
      throw new Error('No data provided for export');
    }

    let blob: Blob;
    let finalFilename: string;
    let mimeType: string;

    // 형식별 변환
    switch (format) {
      case 'json':
        blob = new Blob([dataToJson(data)], { type: 'application/json' });
        finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        blob = new Blob([dataToCsv(data, csvOptions)], { type: 'text/csv;charset=utf-8;' });
        finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
        mimeType = 'text/csv';
        break;

      case 'xlsx':
        blob = await dataToXlsx(data);
        finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Blob을 Data URL로 변환
    const dataUrl = await blobToDataUrl(blob);

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
      data: {
        filename: finalFilename,
        downloadId,
      },
    };
  } catch (error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in export-data handler',
      data: undefined,
    };
  }
}

/**
 * Blob을 Data URL로 변환
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
