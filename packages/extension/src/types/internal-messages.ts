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
    originTabId?: number;
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

export interface CdpExecuteJavaScriptMessage {
  type: 'CDP_EXECUTE_JAVASCRIPT';
  data: {
    code: string;
    returnResult: boolean;
    timeout: number;
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

export interface ExportDataMessage {
  type: 'EXPORT_DATA';
  data: {
    data: any;
    format: 'json' | 'csv' | 'xlsx';
    filename?: string;
    csvOptions?: {
      delimiter?: string;
      includeHeaders?: boolean;
    };
  };
}

export interface NetworkCatchMessage {
  type: 'NETWORK_CATCH';
  data: {
    tabId?: number; // Optional tabId, will use sender tab if not provided
    urlPattern?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    status?: number | { min?: number; max?: number };
    mimeType?: string;
    requestBodyPattern?: string | Record<string, any>; // Request body 필터 추가
    waitForRequest?: boolean;
    waitTimeout?: number;
    returnAll?: boolean;
    includeHeaders?: boolean;
  };
}

// UI Control Messages
export interface ShowExecutionStatusMessage {
  type: 'SHOW_EXECUTION_STATUS';
  data: {
    message?: string;
    statusType?: 'loading' | 'success' | 'error';
    icon?: 'login' | 'download' | 'mail' | 'default';
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  };
}

export interface HideExecutionStatusMessage {
  type: 'HIDE_EXECUTION_STATUS';
}

export interface ShowConfirmationMessage {
  type: 'SHOW_CONFIRMATION';
  data: {
    message: string;
    buttonText?: string; // 워크플로우 실행 중에는 버튼 없이 정보만 표시
    position?: 'top' | 'bottom';
    variant?: 'default' | 'warning' | 'info' | 'success';
    icon?: 'shield' | 'click' | 'alert';
    showClose?: boolean;
    parentTabId?: number; // 원래 탭으로 돌아가기 위한 부모 탭 ID (워크플로우 실행 시에는 없을 수 있음)
  };
}

export interface CloseTabMessage {
  type: 'CLOSE_TAB';
  data: {
    parentTabId?: number; // 닫은 후 포커스할 부모 탭 ID
  };
}

export interface TriggerConfirmationMessage {
  type: 'TRIGGER_CONFIRMATION';
  data: {};
}

// Internal Message Union Types
export type BackgroundMessage =
  | CollectWorkflowNewTabMessage
  | CdpClickMessage
  | CdpKeypressMessage
  | CdpExecuteJavaScriptMessage
  | FetchApiMessage
  | ExportDataMessage
  | NetworkCatchMessage;
export type ContentMessage =
  | ExecuteBlockMessage
  | ShowExecutionStatusMessage
  | HideExecutionStatusMessage
  | ShowConfirmationMessage
  | CloseTabMessage
  | TriggerConfirmationMessage;

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

export function isCdpExecuteJavaScriptMessage(message: any): message is CdpExecuteJavaScriptMessage {
  return message && message.type === 'CDP_EXECUTE_JAVASCRIPT';
}

export function isFetchApiMessage(message: any): message is FetchApiMessage {
  return message && message.type === 'FETCH_API';
}

export function isExportDataMessage(message: any): message is ExportDataMessage {
  return message && message.type === 'EXPORT_DATA';
}

export function isNetworkCatchMessage(message: any): message is NetworkCatchMessage {
  return message && message.type === 'NETWORK_CATCH';
}

export function isShowExecutionStatusMessage(message: any): message is ShowExecutionStatusMessage {
  return message && message.type === 'SHOW_EXECUTION_STATUS';
}

export function isHideExecutionStatusMessage(message: any): message is HideExecutionStatusMessage {
  return message && message.type === 'HIDE_EXECUTION_STATUS';
}

export function isShowConfirmationMessage(message: any): message is ShowConfirmationMessage {
  return message && message.type === 'SHOW_CONFIRMATION';
}

export function isCloseTabMessage(message: any): message is CloseTabMessage {
  return message && message.type === 'CLOSE_TAB';
}

export function isTriggerConfirmationMessage(message: any): message is TriggerConfirmationMessage {
  return message && message.type === 'TRIGGER_CONFIRMATION';
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.$isError === true;
}
