import z from 'zod';
import { Block, BlockResult } from '../types';
import { DOMProvider, ExportOptions } from '../dom';

/**
 * ExportData Block
 *
 * 크롤링한 데이터를 JSON, CSV, 또는 Excel 파일로 저장합니다.
 * DOMProvider의 exportData 메서드를 사용하여 플랫폼별 파일 저장을 수행합니다.
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
  format?: 'json' | 'csv' | 'xlsx' | 'txt'; // 파일 형식 (기본값: json)
  filename: string; // 파일명
  // CSV 전용 옵션
  csvOptions?: {
    delimiter?: string; // 구분자 (기본값: ',')
    includeHeaders?: boolean; // 헤더 포함 여부 (기본값: true)
  };
  // 기타 옵션
  includeHeaders?: boolean; // CSV/XLSX의 헤더 포함 여부 (기본값: true)
  compression?: boolean; // 압축 여부 (기본값: false)
}

// ExportData 블록용 스키마 (검증용)
export const ExportDataBlockSchema = z.object({
  name: z.literal('export-data'),
  data: z.any(),
  format: z.enum(['json', 'csv', 'xlsx', 'txt']).optional().default('json'),
  filename: z.string(),
  csvOptions: z
    .object({
      delimiter: z.string().optional(),
      includeHeaders: z.boolean().optional(),
    })
    .optional(),
  includeHeaders: z.boolean().optional().default(true),
  compression: z.boolean().optional().default(false),
});

export function validateExportDataBlock(data: unknown): ExportDataBlock {
  return ExportDataBlockSchema.parse(data) as ExportDataBlock;
}

/**
 * ExportData 블록 핸들러
 *
 * DOMProvider를 통해 데이터를 파일로 내보냅니다.
 */
export async function handlerExportData(
  block: ExportDataBlock,
  domProvider: DOMProvider
): Promise<BlockResult<{ filename: string; downloadId?: number }>> {
  try {
    const { data, format = 'json', filename, csvOptions, includeHeaders = true, compression = false } = block;

    // Check if data is provided
    if (data === null || data === undefined) {
      return {
        hasError: true,
        message: 'No data provided for export',
        data: undefined,
      };
    }

    console.log('[ExportDataBlock] Exporting data with format:', format);

    // Check if exportData method is available on the DOMProvider
    if (!domProvider.exportData) {
      return {
        hasError: true,
        message: 'Data export is not supported in this environment',
        data: undefined,
      };
    }

    // Prepare export options
    const exportOptions: ExportOptions = {
      filename,
      format,
      includeHeaders: csvOptions?.includeHeaders ?? includeHeaders,
      compression,
    };

    // Use DOMProvider's exportData method
    await domProvider.exportData(data, exportOptions);

    // Ensure filename has the correct extension
    let finalFilename = filename;
    const extension = `.${format}`;
    if (!finalFilename.endsWith(extension)) {
      finalFilename += extension;
    }

    console.log('[ExportDataBlock] Export successful:', finalFilename);
    return {
      data: {
        filename: finalFilename,
      },
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