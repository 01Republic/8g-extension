import { z } from 'zod';
import { Block, BlockResult } from './types';
import { CheckType } from '@/sidepanel/types';

/**
 * CheckStatus Block
 * 
 * 워크플로우 실행 중 사용자의 상태 확인이 필요한 시점에 사이드패널을 열어
 * 상호작용을 수행합니다.
 * 
 * 사용 예:
 * {
 *   name: 'check-status',
 *   checkType: 'login',
 *   title: '로그인 상태 확인',
 *   description: '로그인이 완료되었는지 확인해주세요',
 *   options: {
 *     timeoutMs: 60000,
 *     retryable: true
 *   }
 * }
 */
export interface CheckStatusBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'check-status';
  checkType: CheckType;
  title: string;
  description?: string;
  options?: {
    timeoutMs?: number;
    retryable?: boolean;
    customValidator?: string;
  };
}

// Zod Schema
export const CheckStatusBlockSchema = z.object({
  name: z.literal('check-status'),
  checkType: z.enum(['login', 'pageLoad', 'element', 'custom']),
  title: z.string(),
  description: z.string().optional(),
  options: z
    .object({
      timeoutMs: z.number().optional(),
      retryable: z.boolean().optional(),
      customValidator: z.string().optional(),
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
 * Content Script에서 직접 UI를 표시하여 사용자의 상태 확인을 요청합니다.
 */
export async function handlerCheckStatus(
  block: CheckStatusBlock
): Promise<BlockResult<any>> {
  try {
    // Content Script에서 직접 UI를 표시
    const result = await new Promise<any>((resolve, reject) => {
      // Custom event를 통해 UI 표시 요청
      const eventDetail = {
        checkType: block.checkType,
        title: block.title,
        description: block.description,
        onConfirm: (result: any) => {
          resolve(result);
        },
        onCancel: () => {
          reject(new Error('User cancelled the check'));
        },
      };

      // 타임아웃 설정
      let timeoutId: NodeJS.Timeout | null = null;
      if (block.options?.timeoutMs) {
        timeoutId = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('8g-hide-check-status'));
          reject(new Error('Check status timeout'));
        }, block.options.timeoutMs);
      }

      // UI 표시 이벤트 발생
      window.dispatchEvent(
        new CustomEvent('8g-show-check-status', {
          detail: {
            ...eventDetail,
            onConfirm: (result: any) => {
              if (timeoutId) clearTimeout(timeoutId);
              window.dispatchEvent(new CustomEvent('8g-hide-check-status'));
              eventDetail.onConfirm(result);
            },
            onCancel: () => {
              if (timeoutId) clearTimeout(timeoutId);
              window.dispatchEvent(new CustomEvent('8g-hide-check-status'));
              eventDetail.onCancel();
            },
          },
        })
      );
    });

    return {
      data: result.data || { confirmed: true },
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
export function performStatusCheck(checkType: CheckType): { success: boolean; message: string; data?: any } {
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

  const isLoggedIn = loggedInIndicators.some(indicator => !!indicator);

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
  const emailElement = document.querySelector('[data-email]') || 
                       document.querySelector('.user-email') ||
                       document.querySelector('input[type="email"][disabled]');
  
  const nameElement = document.querySelector('[data-name]') || 
                      document.querySelector('.user-name') ||
                      document.querySelector('.profile-name');

  return {
    email: emailElement?.textContent || emailElement?.getAttribute('value') || 'unknown@example.com',
    name: nameElement?.textContent || 'User',
  };
}