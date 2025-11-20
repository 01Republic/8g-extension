import { CheckStatusPayload, SidePanelActionPayload, UpdateSidePanelPayload } from '@/sidepanel/types';

export class SidePanelService {
  private currentCheckResolve: ((value: any) => void) | null = null;
  private currentCheckReject: ((reason?: any) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.setupMessageListeners();
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SIDE_PANEL_READY') {
        console.log('Side panel is ready');
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'SIDE_PANEL_ACTION') {
        this.handleSidePanelAction(message.payload);
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'GET_ACCOUNT_INFO') {
        // 현재 활성 탭에서 계정 정보 추출 (예시)
        this.getAccountInfo().then((accountInfo) => {
          sendResponse({ accountInfo });
        });
        return true;
      }
    });
  }

  async openSidePanel(tabId: number, payload: CheckStatusPayload): Promise<any> {
    try {
      // Chrome 116+ Side Panel API
      if (chrome.sidePanel) {
        await chrome.sidePanel.open({ tabId });
        
        // 사이드패널에 초기 데이터 전송
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'OPEN_SIDE_PANEL',
            payload,
          });
        }, 100);

        // Promise로 사용자 액션 대기
        return new Promise((resolve, reject) => {
          this.currentCheckResolve = resolve;
          this.currentCheckReject = reject;

          // 타임아웃 설정
          if (payload.options?.timeoutMs) {
            this.timeoutId = setTimeout(() => {
              this.updateSidePanel({
                status: 'error',
                message: '시간 초과되었습니다.',
              });
              reject(new Error('Check status timeout'));
            }, payload.options.timeoutMs);
          }
        });
      } else {
        throw new Error('Side Panel API is not available');
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
      throw error;
    }
  }

  updateSidePanel(payload: UpdateSidePanelPayload) {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SIDE_PANEL',
      payload,
    });
  }

  private handleSidePanelAction(payload: SidePanelActionPayload) {
    console.log('Handling side panel action:', payload);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (payload.action === 'confirm') {
      // 현재 탭에서 상태 확인 로직 실행
      this.checkCurrentStatus(payload).then((result) => {
        if (result.success) {
          this.updateSidePanel({
            status: 'success',
            message: result.message || '확인되었습니다!',
            data: result.data,
          });
          if (this.currentCheckResolve) {
            this.currentCheckResolve(result);
            this.currentCheckResolve = null;
          }
        } else {
          this.updateSidePanel({
            status: 'error',
            message: result.message || '확인에 실패했습니다.',
          });
        }
      });
    } else if (payload.action === 'cancel') {
      if (this.currentCheckReject) {
        this.currentCheckReject(new Error('User cancelled'));
        this.currentCheckReject = null;
      }
    } else if (payload.action === 'retry') {
      this.updateSidePanel({
        status: 'checking',
        message: '다시 확인 중...',
      });
    }
  }

  private async checkCurrentStatus(payload: any): Promise<any> {
    // 실제 상태 확인 로직 (예시)
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.id) {
        return { success: false, message: '활성 탭을 찾을 수 없습니다.' };
      }

      // 컨텐츠 스크립트에 상태 확인 요청
      return new Promise((resolve) => {
        chrome.tabs.sendMessage(activeTab.id!, {
          type: 'CHECK_STATUS',
          checkType: payload.checkType || 'login',
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ 
              success: false, 
              message: '페이지 상태 확인에 실패했습니다.' 
            });
          } else {
            resolve(response || { 
              success: false, 
              message: '응답이 없습니다.' 
            });
          }
        });
      });
    } catch (error) {
      return { 
        success: false, 
        message: '상태 확인 중 오류가 발생했습니다.' 
      };
    }
  }

  private async getAccountInfo(): Promise<any> {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.id) {
        return null;
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(activeTab.id!, {
          type: 'GET_ACCOUNT_INFO',
        }, (response) => {
          resolve(response || null);
        });
      });
    } catch (error) {
      return null;
    }
  }

  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.currentCheckResolve = null;
    this.currentCheckReject = null;
  }
}