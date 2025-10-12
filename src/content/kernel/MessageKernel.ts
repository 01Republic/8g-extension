import { Block, BlockResult } from '@/blocks';
import {
  CollectWorkflowNewTabMessage,
  ErrorResponse,
  isErrorResponse,
} from '@/types/internal-messages';

/**
 * 메시지 처리 커널
 * Extension 내의 모든 메시지 라우팅과 처리를 담당하는 중앙 집중식 서비스
 * OS 커널처럼 시스템의 핵심 메시지 처리 로직을 관리
 */
export class MessageKernel {
  /**
   * Background script로 메시지 전송
   */
  async sendToBackground(message: CollectWorkflowNewTabMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Communication error'));
        } else if (isErrorResponse(response)) {
          reject(new Error(response.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Content script에서 Block 실행
   */
  async executeBlock(block: Block): Promise<BlockResult> {
    // 동적 import로 circular dependency 방지
    const { BlockHandler } = await import('@/blocks');
    const { synchronizedLock } = await import('../utils');

    await synchronizedLock.getLock();

    try {
      return await BlockHandler.executeBlock(block);
    } finally {
      synchronizedLock.releaseLock();
    }
  }

  /**
   * Chrome runtime 메시지 처리 (Background -> Content)
   */
  async handleRuntimeMessage(message: any): Promise<BlockResult | ErrorResponse> {
    if (message?.isBlock && message?.type === 'EXECUTE_BLOCK') {
      try {
        const result = await this.executeBlock(message.data);
        return result;
      } catch (error) {
        return {
          $isError: true,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: {},
        } as ErrorResponse;
      }
    }

    throw new Error('Invalid message type');
  }

  /**
   * Window message를 웹페이지로 전송
   */
  sendToWebpage(message: any): void {
    window.postMessage(message, '*');
  }

  /**
   * 에러 응답 생성 헬퍼
   */
  createErrorResponse(requestId: string, error: any) {
    return {
      type: '8G_COLLECT_RESPONSE',
      requestId,
      success: false,
      result: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 성공 응답 생성 헬퍼
   */
  createSuccessResponse(requestId: string, result: any) {
    return {
      type: '8G_COLLECT_RESPONSE',
      requestId,
      success: true,
      result,
    };
  }
}
