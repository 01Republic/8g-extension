import { ErrorResponse } from '@/types/internal-messages';

export interface DataExtractRequest {
  code: string;
  inputData?: any;
}

export class DataExtractService {
  /**
   * 데이터 추출 요청을 처리하고 응답을 전송합니다.
   */
  async handleRequest(
    requestData: DataExtractRequest,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      console.log('[DataExtractService] Handle data extract request');

      const result = await this.extractData(requestData);

      sendResponse({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[DataExtractService] Data extraction error:', error);
      sendResponse({
        $isError: true,
        message: error instanceof Error ? error.message : 'Unknown error in data extraction',
        data: null,
      } as ErrorResponse);
    }
  }

  /**
   * JavaScript 코드를 실행하여 데이터를 추출합니다.
   */
  async extractData(request: DataExtractRequest): Promise<any> {
    const { code, inputData } = request;

    console.log('[DataExtractService] Extracting data with code length:', code.length);

    try {
      // Function 생성자를 사용하여 코드 실행
      // data 변수로 입력 데이터 전달
      const extractFunction = new Function('data', code);
      const result = extractFunction(inputData);

      console.log('[DataExtractService] Data extraction successful');
      return result;
    } catch (error) {
      console.error('[DataExtractService] Code execution error:', error);
      throw new Error(
        `Failed to execute extraction code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

