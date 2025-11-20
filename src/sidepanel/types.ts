export type SidePanelStatus = 'idle' | 'checking' | 'success' | 'error' | 'waiting';

export type CheckType = 'login' | 'pageLoad' | 'element' | 'custom';

export interface CheckStatusPayload {
  checkType: CheckType;
  title: string;
  description?: string;
  options?: {
    timeoutMs?: number;
    retryable?: boolean;
    customValidator?: string;
  };
}

export interface SidePanelActionPayload {
  action: 'confirm' | 'cancel' | 'retry';
  data?: any;
}

export interface UpdateSidePanelPayload {
  status: SidePanelStatus;
  message: string;
  data?: any;
}