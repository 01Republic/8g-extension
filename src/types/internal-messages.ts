import { Block, BlockResult } from '@/blocks';
import type { Workflow } from '@/sdk/types';

// Background -> Content Script Messages
export interface ExecuteBlockMessage {
  isBlock: true;
  type: 'EXECUTE_BLOCK';
  data: Block;
}

// Content Script -> Background Messages
export interface CollectWorkflowNewTabMessage {
  type: 'COLLECT_WORKFLOW_NEW_TAB';
  data: {
    targetUrl: string;
    workflow: Workflow;
    closeTabAfterCollection?: boolean;
    activateTab?: boolean;
  };
}

export interface CdpClickMessage {
  type: 'CDP_CLICK';
  data: {
    x: number;
    y: number;
  };
}

export interface CdpKeypressMessage {
  type: 'CDP_KEYPRESS';
  data: {
    key: string;
    code: string;
    keyCode: number;
    modifiers: string[];
  };
}

export interface FetchApiMessage {
  type: 'FETCH_API';
  data: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers: Record<string, string>;
    body?: any;
    timeout: number;
    parseJson: boolean;
    returnHeaders: boolean;
  };
}

// UI Control Messages
export interface ShowExecutionStatusMessage {
  type: 'SHOW_EXECUTION_STATUS';
  data: {
    message?: string;
  };
}

export interface HideExecutionStatusMessage {
  type: 'HIDE_EXECUTION_STATUS';
}

// Internal Message Union Types
export type BackgroundMessage = CollectWorkflowNewTabMessage | CdpClickMessage | CdpKeypressMessage | FetchApiMessage;
export type ContentMessage = ExecuteBlockMessage | ShowExecutionStatusMessage | HideExecutionStatusMessage;

// Response Types for Internal Communication
export interface ErrorResponse {
  $isError: true;
  message: string;
  data: object | null;
}

// Block Execution Response (specifically for content script)
export type BlockExecutionResponse = BlockResult | ErrorResponse;

// Type guards for internal messages
export function isExecuteBlockMessage(message: any): message is ExecuteBlockMessage {
  return message && message.isBlock === true && message.type === 'EXECUTE_BLOCK';
}

export function isCdpClickMessage(message: any): message is CdpClickMessage {
  return message && message.type === 'CDP_CLICK';
}

export function isCdpKeypressMessage(message: any): message is CdpKeypressMessage {
  return message && message.type === 'CDP_KEYPRESS';
}

export function isFetchApiMessage(message: any): message is FetchApiMessage {
  return message && message.type === 'FETCH_API';
}

export function isShowExecutionStatusMessage(message: any): message is ShowExecutionStatusMessage {
  return message && message.type === 'SHOW_EXECUTION_STATUS';
}

export function isHideExecutionStatusMessage(message: any): message is HideExecutionStatusMessage {
  return message && message.type === 'HIDE_EXECUTION_STATUS';
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.$isError === true;
}
