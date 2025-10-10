import { Block, BlockResult } from '@/blocks';
import type { Workflow } from '@/sdk/types';

// Background -> Content Script Messages
export interface ExecuteBlockMessage {
  isBlock: true;
  type: 'EXECUTE_BLOCK';
  data: Block;
}

// Content Script -> Background Messages
export interface CollectDataNewTabMessage {
  type: 'COLLECT_DATA_NEW_TAB';
  data: {
    targetUrl: string;
    block: Block | Block[]; // 단일 블록 또는 블록 배열 지원
    closeTabAfterCollection?: boolean;
    activateTab?: boolean;
    blockDelay?: number; // 블록 간 지연 시간 (ms) - 기본값: 500ms
  };
}

export interface CollectWorkflowNewTabMessage {
  type: 'COLLECT_WORKFLOW_NEW_TAB';
  data: {
    targetUrl: string;
    workflow: Workflow;
    closeTabAfterCollection?: boolean;
    activateTab?: boolean;
  };
}

// Internal Message Union Types
export type BackgroundMessage = CollectDataNewTabMessage | CollectWorkflowNewTabMessage;
export type ContentMessage = ExecuteBlockMessage;

// Response Types for Internal Communication
export interface ErrorResponse {
  $isError: true;
  message: string;
  data: object | null;
}

// Block Execution Response (specifically for content script)
export type BlockExecutionResponse = BlockResult | ErrorResponse;

// Background Step Response
export interface BackgroundStepResponse<T> {
  success: true;
  targetUrl: string;
  tabId: number;
  result: BlockResult<T> | BlockResult<T>[]; // 단일 또는 배열 결과
  timestamp: string;
  closeTabAfterCollection: boolean;
}

// Type guards for internal messages
export function isExecuteBlockMessage(message: any): message is ExecuteBlockMessage {
  return message && message.isBlock === true && message.type === 'EXECUTE_BLOCK';
}

export function isCollectDataNewTabMessage(message: any): message is CollectDataNewTabMessage {
  return message && message.type === 'COLLECT_DATA_NEW_TAB';
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.$isError === true;
}
