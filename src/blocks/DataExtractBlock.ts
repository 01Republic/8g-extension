import z from 'zod';
import { Block, BlockResult } from './types';

export interface DataExtractBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'data-extract';
  code: string; // JavaScript 코드
  inputData?: any; // 입력 데이터 (이전 블록 결과 등)
}

export const DataExtractBlockSchema = z.object({
  name: z.literal('data-extract'),
  code: z.string(),
  inputData: z.any().optional(),
});

export function validateDataExtractBlock(data: unknown): DataExtractBlock {
  return DataExtractBlockSchema.parse(data) as DataExtractBlock;
}

export async function handlerDataExtract(data: DataExtractBlock): Promise<BlockResult<any>> {
  try {
    console.log('[DataExtractBlock] Executing data extraction in page context');

    // 웹페이지 컨텍스트에 script를 inject하여 실행 (CSP 제약 없음)
    const result = await new Promise((resolve, reject) => {
      const scriptId = `data-extract-${Date.now()}-${Math.random()}`;
      
      // 결과를 받을 이벤트 리스너 등록
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'DATA_EXTRACT_RESULT' && event.data?.scriptId === scriptId) {
          window.removeEventListener('message', messageHandler);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      window.addEventListener('message', messageHandler);

      // 웹페이지 컨텍스트에서 실행될 script 생성
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          try {
            const data = ${JSON.stringify(data.inputData)};
            const extractFunction = new Function('data', ${JSON.stringify(data.code)});
            const result = extractFunction(data);
            window.postMessage({
              type: 'DATA_EXTRACT_RESULT',
              scriptId: '${scriptId}',
              result: result
            }, '*');
          } catch (error) {
            window.postMessage({
              type: 'DATA_EXTRACT_RESULT',
              scriptId: '${scriptId}',
              error: error.message
            }, '*');
          }
        })();
      `;
      
      document.documentElement.appendChild(script);
      script.remove();

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        reject(new Error('Data extraction timeout'));
      }, 10000);
    });

    console.log('[DataExtractBlock] Data extraction successful');
    return {
      data: result,
    };
  } catch (error) {
    console.error('[DataExtractBlock] Data extraction error:', error);
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error in data extraction',
      data: undefined,
    };
  }
}

