import z from 'zod';
import { Block, BlockResult } from './types';

/**
 * ExportData Block
 *
 * 크롤링한 데이터를 JSON, CSV, 또는 Excel 파일로 저장합니다.
 * Background의 Chrome Downloads API를 사용하여 파일을 다운로드합니다.
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
  csvOptions: z
    .object({
      delimiter: z.string().optional(),
      includeHeaders: z.boolean().optional(),
    })
    .optional(),
});

export function validateExportDataBlock(data: unknown): ExportDataBlock {
  return ExportDataBlockSchema.parse(data) as ExportDataBlock;
}

/**
 * ExportData 블록 핸들러
 *
 * Background로 메시지를 보내서 데이터를 파일로 내보냅니다.
 */
export async function handlerExportData(
  block: ExportDataBlock
): Promise<BlockResult<{ filename: string; downloadId: number }>> {
  try {
    const { data, format, filename, csvOptions } = block;

    console.log('[ExportDataBlock] Sending export request to background:', format);

    // Background로 export 요청 전송
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_DATA',
      data: {
        data,
        format,
        filename,
        csvOptions,
      },
    });

    if (response.$isError) {
      return {
        hasError: true,
        message: response.message || 'Export failed',
        data: undefined,
      };
    }

    console.log('[ExportDataBlock] Export successful:', response.data.filename);
    return {
      data: response.data,
    };
  } catch (error) {
    console.error('[ExportDataBlock] Export error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in export-data handler',
      data: undefined,
    };
  }
}
