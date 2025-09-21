import { Block } from '@/blocks';

// Window Messages (for webpage communication)
export interface ExtensionCheckMessage {
  type: '8G_EXTENSION_CHECK';
}

export interface CollectDataMessage {
  type: '8G_COLLECT_DATA';
  requestId: string;
  targetUrl: string;
  block: Block;
  closeTabAfterCollection?: boolean;
  activateTab?: boolean;
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

// External Message Union Type
export type WindowMessage =
  | ExtensionCheckMessage
  | CollectDataMessage
  | ExtensionResponseMessage
  | CollectResponseMessage;

// Type guards for external messages
export function isExtensionCheckMessage(message: any): message is ExtensionCheckMessage {
  return message && message.type === '8G_EXTENSION_CHECK';
}

export function isCollectDataMessage(message: any): message is CollectDataMessage {
  return message && message.type === '8G_COLLECT_DATA';
}

export function isExtensionResponseMessage(message: any): message is ExtensionResponseMessage {
  return message && message.type === '8G_EXTENSION_RESPONSE';
}

export function isCollectResponseMessage(message: any): message is CollectResponseMessage {
  return message && message.type === '8G_COLLECT_RESPONSE';
}
