import { z } from 'zod';
import { Block, BlockResult } from './types';
import { CheckType } from '@/sidepanel/types';

/**
 * CheckStatus Block
 *
 * 워크플로우 실행 중 사용자의 상태 확인이 필요한 시점에 플로팅 알림 버튼을 표시하고,
 * 사용자 클릭 시 사이드패널을 열어 상호작용을 수행합니다.
 *
 * 사용 예:
 * {
 *   name: 'check-status',
 *   checkType: 'login',
 *   title: '로그인 상태 확인',
 *   description: '로그인이 완료되었는지 확인해주세요',
 *   notification: {
 *     message: '로그인 확인 필요',
 *     urgency: 'high'
 *   },
 *   options: {
 *     timeoutMs: 60000,
 *     retryable: true,
 *     autoOpen: false
 *   }
 * }
 */
export interface CheckStatusBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'check-status';
  checkType: CheckType;
  title: string;
  description?: string;
  notification?: {
    message: string;
    urgency?: 'low' | 'medium' | 'high';
  };
  options?: {
    timeoutMs?: number;
    retryable?: boolean;
    autoOpen?: boolean; // 향후 Chrome API 개선 시 자동 열기 옵션
    customValidator?: string;
    autoClick?: boolean; // CDP 자동 클릭 활성화
    clickDelay?: number; // 클릭 전 대기 시간 (ms)
    fallbackToManual?: boolean; // 자동 클릭 실패 시 수동 모드
  };
}

// Zod Schema
export const CheckStatusBlockSchema = z.object({
  name: z.literal('check-status'),
  checkType: z.enum(['login', 'pageLoad', 'element', 'custom']),
  title: z.string(),
  description: z.string().optional(),
  notification: z
    .object({
      message: z.string(),
      urgency: z.enum(['low', 'medium', 'high']).optional(),
    })
    .optional(),
  options: z
    .object({
      timeoutMs: z.number().optional(),
      retryable: z.boolean().optional(),
      autoOpen: z.boolean().optional(),
      customValidator: z.string().optional(),
      autoClick: z.boolean().optional(),
      clickDelay: z.number().optional(),
      fallbackToManual: z.boolean().optional(),
    })
    .optional(),
});

// Validation function
export function validateCheckStatusBlock(data: unknown): CheckStatusBlock {
  return CheckStatusBlockSchema.parse(data) as CheckStatusBlock;
}

/**
 * CheckStatus 블록 핸들러
 *
 * 플로팅 알림 버튼을 표시하고, 사용자 클릭 시 Side Panel을 열어 상태를 확인합니다.
 */
export async function handlerCheckStatus(block: CheckStatusBlock): Promise<BlockResult<any>> {
  try {
    // 고유 ID 생성
    const notificationId = `check-status-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 알림 메시지 준비
    const notificationMessage = block.notification?.message || `${block.title} 확인이 필요합니다`;

    const urgency = block.notification?.urgency || 'medium';

    // 플로팅 알림 버튼 표시
    window.dispatchEvent(
      new CustomEvent('8g-show-notification', {
        detail: {
          id: notificationId,
          message: notificationMessage,
          urgency: urgency,
          checkType: block.checkType,
          title: block.title,
          description: block.description,
          options: block.options,
          autoClick: block.options?.autoClick,
        },
      })
    );

    // Auto-click 처리
    if (block.options?.autoClick) {
      const clickDelay = block.options.clickDelay || 500;
      console.log(`[CheckStatusBlock] Auto-click enabled, waiting ${clickDelay}ms before clicking`);

      // 버튼 렌더링 대기
      await new Promise((resolve) => setTimeout(resolve, clickDelay));

      // CDP 클릭 좌표 계산
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // 고정 위치에서 버튼 중심점 계산 (버튼 크기: 60x60px)
      const buttonSize = 60;
      const position = { right: 60, bottom: 200 }; // FIXED_POSITION과 동일
      const clickCoords = {
        x: viewport.width - position.right - buttonSize / 2,
        y: viewport.height - position.bottom - buttonSize / 2,
      };

      console.log(`[CheckStatusBlock] Sending CDP click to (${clickCoords.x}, ${clickCoords.y})`);

      try {
        // CDP 클릭 요청
        await chrome.runtime.sendMessage({
          type: 'CDP_CLICK',
          data: {
            x: clickCoords.x,
            y: clickCoords.y,
            button: 'left',
          },
        });

        console.log('[CheckStatusBlock] CDP click sent successfully');
      } catch (error) {
        console.error('[CheckStatusBlock] CDP click failed:', error);

        // 폴백 처리
        if (!block.options.fallbackToManual) {
          throw new Error('Auto-click failed and no fallback enabled');
        }
        console.log('[CheckStatusBlock] Falling back to manual mode');
      }
    }

    // Background와 통신하여 Side Panel이 열리고 결과가 올 때까지 대기
    const result = await new Promise<any>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;

      // 타임아웃 설정
      if (block.options?.timeoutMs) {
        timeoutId = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('8g-hide-notification', {
              detail: { id: notificationId },
            })
          );
          reject(new Error('Check status timeout'));
        }, block.options.timeoutMs);
      }

      // 결과 리스너 등록
      const handleResult = (event: CustomEvent) => {
        if (event.detail.notificationId === notificationId) {
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener('8g-check-status-result', handleResult as EventListener);

          // 알림 제거
          window.dispatchEvent(
            new CustomEvent('8g-hide-notification', {
              detail: { id: notificationId },
            })
          );

          if (event.detail.success) {
            resolve(event.detail.data);
          } else {
            reject(new Error(event.detail.message || 'Check status failed'));
          }
        }
      };

      // 사용자가 알림을 무시한 경우 처리
      const handleDismiss = (event: CustomEvent) => {
        if (event.detail.notificationId === notificationId) {
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener('8g-notification-dismissed', handleDismiss as EventListener);
          window.removeEventListener('8g-check-status-result', handleResult as EventListener);
          reject(new Error('User dismissed the notification'));
        }
      };

      window.addEventListener('8g-check-status-result', handleResult as EventListener);
      window.addEventListener('8g-notification-dismissed', handleDismiss as EventListener);

      // 폴백: Side Panel이 열리지 않는 경우 기존 인라인 UI 사용
      const handleFallback = (event: CustomEvent) => {
        if (event.detail.id === notificationId) {
          if (timeoutId) clearTimeout(timeoutId);
          window.removeEventListener(
            '8g-show-check-status-fallback',
            handleFallback as EventListener
          );

          // 기존 CheckStatusUI 표시
          window.dispatchEvent(
            new CustomEvent('8g-show-check-status', {
              detail: {
                checkType: block.checkType,
                title: block.title,
                description: block.description,
                onConfirm: (result: any) => {
                  window.dispatchEvent(new CustomEvent('8g-hide-check-status'));
                  window.dispatchEvent(
                    new CustomEvent('8g-hide-notification', {
                      detail: { id: notificationId },
                    })
                  );
                  resolve(result);
                },
                onCancel: () => {
                  window.dispatchEvent(new CustomEvent('8g-hide-check-status'));
                  window.dispatchEvent(
                    new CustomEvent('8g-hide-notification', {
                      detail: { id: notificationId },
                    })
                  );
                  reject(new Error('User cancelled'));
                },
              },
            })
          );
        }
      };

      window.addEventListener('8g-show-check-status-fallback', handleFallback as EventListener);
    });

    return {
      data: result || { confirmed: true },
      hasError: false,
    };
  } catch (error) {
    return {
      data: null,
      hasError: true,
      message: error instanceof Error ? error.message : 'Check status failed',
    };
  }
}

// 특정 체크 타입에 대한 검증 로직 (Content Script에서 실행)
export function performStatusCheck(checkType: CheckType): {
  success: boolean;
  message: string;
  data?: any;
} {
  switch (checkType) {
    case 'login':
      return checkLoginStatus();
    case 'pageLoad':
      return checkPageLoadStatus();
    case 'element':
      return checkElementStatus();
    case 'custom':
      return { success: true, message: 'Custom check passed' };
    default:
      return { success: false, message: 'Unknown check type' };
  }
}

function checkLoginStatus(): { success: boolean; message: string; data?: any } {
  // 로그인 상태 체크 로직 (예시)
  const loggedInIndicators = [
    document.querySelector('[data-testid="user-avatar"]'),
    document.querySelector('.user-profile'),
    document.querySelector('#account-menu'),
    document.cookie.includes('session='),
    localStorage.getItem('user_id'),
  ];

  const isLoggedIn = loggedInIndicators.some((indicator) => !!indicator);

  if (isLoggedIn) {
    // 계정 정보 추출 시도
    const accountInfo = extractAccountInfo();
    return {
      success: true,
      message: '로그인되어 있습니다!',
      data: accountInfo,
    };
  }

  return {
    success: false,
    message: '로그인이 필요합니다.',
  };
}

function checkPageLoadStatus(): { success: boolean; message: string } {
  const isLoaded = document.readyState === 'complete';
  return {
    success: isLoaded,
    message: isLoaded ? '페이지가 완전히 로드되었습니다.' : '페이지 로딩 중...',
  };
}

function checkElementStatus(): { success: boolean; message: string } {
  // 특정 요소 존재 여부 체크
  const targetElement = document.querySelector('[data-status-check]');
  return {
    success: !!targetElement,
    message: targetElement ? '요소를 찾았습니다.' : '요소를 찾을 수 없습니다.',
  };
}

function extractAccountInfo(): any {
  // 페이지에서 계정 정보 추출 (페이지별로 다름)
  const emailElement =
    document.querySelector('[data-email]') ||
    document.querySelector('.user-email') ||
    document.querySelector('input[type="email"][disabled]');

  const nameElement =
    document.querySelector('[data-name]') ||
    document.querySelector('.user-name') ||
    document.querySelector('.profile-name');

  return {
    email:
      emailElement?.textContent || emailElement?.getAttribute('value') || 'unknown@example.com',
    name: nameElement?.textContent || 'User',
  };
}
