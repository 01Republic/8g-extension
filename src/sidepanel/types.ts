export type CheckType = 'login' | 'pageLoad' | 'element' | 'custom';

export interface CheckStatusRequest {
  notificationId: string;
  checkType: CheckType;
  title: string;
  description?: string;
  options?: {
    timeoutMs?: number;
    retryable?: boolean;
    autoOpen?: boolean;
    customValidator?: string;
  };
  tabId?: number;
}

export interface CheckStatusResult {
  notificationId: string;
  success: boolean;
  data?: any;
  message?: string;
}
