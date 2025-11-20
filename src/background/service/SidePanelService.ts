import { CheckType } from '@/sidepanel/types';

export class SidePanelService {
  private pendingChecks = new Map<string, CheckStatusRequest>();

  constructor() {
    this.initializeMessageListener();
  }

  private initializeMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'OPEN_SIDE_PANEL_FROM_NOTIFICATION') {
        this.handleOpenSidePanel(message.payload, sender, sendResponse);
        return true;
      }

      if (message.type === 'NOTIFICATION_DISMISSED') {
        this.handleNotificationDismissed(message.payload);
        return false;
      }

      if (message.type === 'SIDE_PANEL_READY') {
        this.handleSidePanelReady(sendResponse);
        return true;
      }

      if (message.type === 'CHECK_STATUS_RESULT') {
        this.handleCheckStatusResult(message.payload);
        return false;
      }

      return false;
    });
  }

  private async handleOpenSidePanel(
    payload: CheckStatusRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ) {
    try {
      const { notificationId, checkType, title, description, options } = payload;

      this.pendingChecks.set(notificationId, {
        notificationId,
        checkType,
        title,
        description,
        options,
        tabId: sender.tab?.id,
      });

      if (!sender.tab?.id) {
        throw new Error('No tab ID found');
      }

      await chrome.sidePanel.open({ tabId: sender.tab.id });
      
      sendResponse({ success: true });

      setTimeout(() => {
        this.sendCheckStatusToSidePanel(notificationId);
      }, 100);
      
    } catch (error) {
      console.error('[SidePanelService] Failed to open side panel:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private handleNotificationDismissed(payload: { notificationId: string }) {
    const check = this.pendingChecks.get(payload.notificationId);
    if (check && check.tabId) {
      chrome.tabs.sendMessage(check.tabId, {
        type: 'CHECK_STATUS_DISMISSED',
        payload: {
          notificationId: payload.notificationId,
          message: 'User dismissed the notification',
        },
      });
    }
    this.pendingChecks.delete(payload.notificationId);
  }

  private handleSidePanelReady(sendResponse: (response: any) => void) {
    const pendingChecksList = Array.from(this.pendingChecks.values());
    
    if (pendingChecksList.length > 0) {
      const firstCheck = pendingChecksList[0];
      sendResponse({
        hasPendingCheck: true,
        check: firstCheck,
      });
    } else {
      sendResponse({
        hasPendingCheck: false,
      });
    }
  }

  private sendCheckStatusToSidePanel(notificationId: string) {
    const check = this.pendingChecks.get(notificationId);
    if (!check) return;

    chrome.runtime.sendMessage({
      type: 'SHOW_CHECK_STATUS',
      payload: check,
    }).catch(error => {
      console.error('[SidePanelService] Failed to send check status to side panel:', error);
    });
  }

  private handleCheckStatusResult(payload: {
    notificationId: string;
    success: boolean;
    data?: any;
    message?: string;
  }) {
    const check = this.pendingChecks.get(payload.notificationId);
    if (check && check.tabId) {
      chrome.tabs.sendMessage(check.tabId, {
        type: '8g-check-status-result',
        detail: {
          notificationId: payload.notificationId,
          success: payload.success,
          data: payload.data,
          message: payload.message,
        },
      });
    }
    
    this.pendingChecks.delete(payload.notificationId);
  }

  public clearPendingChecksForTab(tabId: number) {
    const checksToRemove: string[] = [];
    this.pendingChecks.forEach((check, id) => {
      if (check.tabId === tabId) {
        checksToRemove.push(id);
      }
    });
    
    checksToRemove.forEach(id => this.pendingChecks.delete(id));
  }
}

interface CheckStatusRequest {
  notificationId: string;
  checkType: CheckType;
  title: string;
  description?: string;
  options?: any;
  tabId?: number;
}