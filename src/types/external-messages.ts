import type { Workflow } from '@/sdk/types';

// Window Messages (for webpage communication)
export interface ExtensionCheckMessage {
  type: '8G_EXTENSION_CHECK';
}

export interface ExtensionResponseMessage {
  type: '8G_EXTENSION_RESPONSE';
  installed: boolean;
  version: string;
}

export interface CollectResponseMessage {
  type: '8G_COLLECT_RESPONSE';
  requestId: string;
  success: boolean;
  result: any;
}

export interface CollectWorkflowMessage {
  type: '8G_COLLECT_WORKFLOW';
  requestId: string;
  targetUrl: string;
  workflow: Workflow;
  closeTabAfterCollection?: boolean;
  activateTab?: boolean;
}

// External Message Union Type
export type WindowMessage =
  | ExtensionCheckMessage
  | CollectWorkflowMessage
  | ExtensionResponseMessage
  | CollectResponseMessage;

// Type guards for external messages
export function isExtensionCheckMessage(message: any): message is ExtensionCheckMessage {
  return message && message.type === '8G_EXTENSION_CHECK';
}

export function isCollectWorkflowMessage(message: any): message is CollectWorkflowMessage {
  return message && message.type === '8G_COLLECT_WORKFLOW';
}

export function isExtensionResponseMessage(message: any): message is ExtensionResponseMessage {
  return message && message.type === '8G_EXTENSION_RESPONSE';
}

export function isCollectResponseMessage(message: any): message is CollectResponseMessage {
  return message && message.type === '8G_COLLECT_RESPONSE';
}
