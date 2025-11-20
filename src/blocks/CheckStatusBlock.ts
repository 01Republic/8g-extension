import { z } from 'zod';
import { BlockResult } from '@/types/blocks';
import { CheckType, CheckStatusPayload } from '@/sidepanel/types';

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

export type CheckStatusBlock = z.infer<typeof CheckStatusBlockSchema>;

// Validation function
export function validateCheckStatusBlock(block: any): CheckStatusBlock {
  try {
    return CheckStatusBlockSchema.parse(block);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Check-status block validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// Handler function - Content Script에서 실행
export async function handlerCheckStatusBlock(
  block: CheckStatusBlock
): Promise<BlockResult<any>> {
  try {
    // Content Script에서는 Background로 메시지를 보내 사이드패널 오픈을 요청
    const result = await new Promise<any>((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'OPEN_CHECK_STATUS_PANEL',
          payload: {
            checkType: block.checkType as CheckType,
            title: block.title,
            description: block.description,
            options: block.options,
          } as CheckStatusPayload,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
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