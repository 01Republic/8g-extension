import z from 'zod';
import { Block, BlockResult } from './types';

/**
 * WaitForConditionBlock - 특정 조건 만족 또는 사용자 확인 대기
 *
 * 지원 기능:
 * - 자동 조건: URL 패턴, 요소 존재, 쿠키 존재, 스토리지 키
 * - 수동 확인: Floating UI의 확인 버튼 클릭
 * - 모드: auto (자동만), manual (수동만), auto-or-manual (둘 중 하나)
 */
export interface WaitForConditionBlock extends Omit<Block, 'selector' | 'findBy' | 'option'> {
  readonly name: 'wait-for-condition';
  conditions: {
    // 자동 감지 조건
    urlPattern?: string; // 현재 URL과 매칭할 정규식 패턴
    elementExists?: {
      // 페이지에 요소 존재 여부 확인
      selector: string;
      findBy: 'cssSelector' | 'xpath';
    };
    cookieExists?: string; // 해당 이름의 쿠키 존재 여부
    storageKey?: {
      // 스토리지 키 존재 여부
      type: 'localStorage' | 'sessionStorage';
      key: string;
    };

    // 수동 확인
    userConfirmation?: boolean; // 사용자에게 확인 버튼 표시
    message?: string; // 표시할 메시지 (기본값: "작업을 완료하셨나요?")
    buttonText?: string; // 버튼 텍스트 (기본값: "완료")
  };
  mode?: 'auto' | 'manual' | 'auto-or-manual'; // 기본값: 'auto-or-manual'
  pollingIntervalMs?: number; // 자동 조건 체크 주기 (기본값: 1000ms)
  timeoutMs?: number; // 최대 대기 시간 (기본값: 300000ms = 5분)
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; // UI 위치 (기본값: 'bottom-right')
}

export const WaitForConditionBlockSchema = z.object({
  name: z.literal('wait-for-condition'),
  conditions: z
    .object({
      urlPattern: z.string().optional(),
      elementExists: z
        .object({
          selector: z.string(),
          findBy: z.enum(['cssSelector', 'xpath']),
        })
        .optional(),
      cookieExists: z.string().optional(),
      storageKey: z
        .object({
          type: z.enum(['localStorage', 'sessionStorage']),
          key: z.string(),
        })
        .optional(),
      userConfirmation: z.boolean().optional(),
      message: z.string().optional(),
      buttonText: z.string().optional(),
    })
    .refine(
      (data) => {
        // At least one condition must be specified
        return (
          data.urlPattern !== undefined ||
          data.elementExists !== undefined ||
          data.cookieExists !== undefined ||
          data.storageKey !== undefined ||
          data.userConfirmation === true
        );
      },
      {
        message: 'At least one condition must be specified',
      }
    ),
  mode: z.enum(['auto', 'manual', 'auto-or-manual']).optional(),
  pollingIntervalMs: z.number().min(100).optional(),
  timeoutMs: z.number().min(1000).optional(),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
});

export function validateWaitForConditionBlock(data: unknown): WaitForConditionBlock {
  return WaitForConditionBlockSchema.parse(data);
}

export interface WaitForConditionResult {
  success: boolean;
  reason?:
    | 'urlPattern'
    | 'elementExists'
    | 'cookieExists'
    | 'storageKey'
    | 'userConfirmation'
    | 'timeout'
    | 'tabClosed';
  message?: string;
}

/**
 * wait-for-condition block 핸들러
 * content script에서 호출되며 floating UI와 연동
 */
export async function handlerWaitForCondition(
  data: WaitForConditionBlock
): Promise<BlockResult<WaitForConditionResult>> {
  try {
    const {
      conditions,
      mode = 'auto-or-manual',
      pollingIntervalMs = 1000,
      timeoutMs = 300000,
    } = data;

    console.log('[WaitForCondition] Starting wait with conditions:', conditions);
    console.log('[WaitForCondition] Mode:', mode, 'Timeout:', timeoutMs);

    const hasAutoConditions = !!(
      conditions.urlPattern ||
      conditions.elementExists ||
      conditions.cookieExists ||
      conditions.storageKey
    );
    const hasManualConfirmation = conditions.userConfirmation === true;

    // 필요시 사용자 확인 Promise 설정
    let userConfirmedPromise: Promise<void> | null = null;
    let confirmResolve: (() => void) | null = null;

    if ((mode === 'manual' || mode === 'auto-or-manual') && hasManualConfirmation) {
      userConfirmedPromise = new Promise<void>((resolve) => {
        confirmResolve = resolve;
      });

      // ExecutionStatusUI 표시 이벤트 발생
      window.dispatchEvent(
        new CustomEvent('8g-show-execution-status', {
          detail: {
            message: conditions.message || '작업을 완료하셨나요?',
            statusType: 'loading',
            icon: 'default',
          },
        })
      );
    }

    // 자동 조건 체크 함수
    const checkAutoConditions = async (): Promise<WaitForConditionResult | null> => {
      // URL 패턴 체크
      if (conditions.urlPattern) {
        try {
          const regex = new RegExp(conditions.urlPattern);
          if (regex.test(window.location.href)) {
            return {
              success: true,
              reason: 'urlPattern',
              message: `URL matches pattern: ${conditions.urlPattern}`,
            };
          }
        } catch (error) {
          console.warn('[WaitForCondition] Invalid URL pattern:', error);
        }
      }

      // 요소 존재 체크
      if (conditions.elementExists) {
        const { selector, findBy } = conditions.elementExists;
        let element: Element | null = null;

        if (findBy === 'cssSelector') {
          element = document.querySelector(selector);
        } else if (findBy === 'xpath') {
          const xpathResult = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          element = xpathResult.singleNodeValue as Element | null;
        }

        if (element) {
          return {
            success: true,
            reason: 'elementExists',
            message: `Element found: ${selector}`,
          };
        }
      }

      // 쿠키 존재 체크
      if (conditions.cookieExists) {
        const cookies = document.cookie.split(';');
        const cookieExists = cookies.some((cookie) => {
          const [name] = cookie.trim().split('=');
          return name === conditions.cookieExists;
        });

        if (cookieExists) {
          return {
            success: true,
            reason: 'cookieExists',
            message: `Cookie found: ${conditions.cookieExists}`,
          };
        }
      }

      // 스토리지 키 체크
      if (conditions.storageKey) {
        const { type, key } = conditions.storageKey;
        const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
        const value = storage.getItem(key);

        if (value !== null) {
          return {
            success: true,
            reason: 'storageKey',
            message: `Storage key found: ${type}.${key}`,
          };
        }
      }

      return null;
    };

    // 메인 대기 루프
    return new Promise<BlockResult<WaitForConditionResult>>((resolve) => {
      let intervalId: NodeJS.Timeout | null = null;
      let resolved = false;

      let cleanup = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };

      const resolveWith = (result: WaitForConditionResult) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.log('[WaitForCondition] Resolved with:', result);
        resolve({ data: result });
      };

      // 타임아웃 체크
      const timeoutId = setTimeout(() => {
        resolveWith({
          success: false,
          reason: 'timeout',
          message: `Timeout after ${timeoutMs}ms`,
        });
      }, timeoutMs);

      // 자동 조건 polling 설정
      if ((mode === 'auto' || mode === 'auto-or-manual') && hasAutoConditions) {
        intervalId = setInterval(async () => {
          const result = await checkAutoConditions();
          if (result) {
            clearTimeout(timeoutId);
            resolveWith(result);
          }
        }, pollingIntervalMs);
      }

      // 수동 확인 핸들러 설정
      if ((mode === 'manual' || mode === 'auto-or-manual') && userConfirmedPromise) {
        userConfirmedPromise.then(() => {
          clearTimeout(timeoutId);
          resolveWith({
            success: true,
            reason: 'userConfirmation',
            message: 'User confirmed completion',
          });
        });
      }

      // 외부에서 확인 이벤트를 트리거할 수 있도록 이벤트 리스너 추가
      // (예: 새 탭에서 확인 버튼을 누른 경우)
      if (
        (mode === 'manual' || mode === 'auto-or-manual') &&
        hasManualConfirmation &&
        confirmResolve
      ) {
        const handleTriggerConfirmation = (event: Event) => {
          console.log('[WaitForCondition] External confirmation triggered via event', {
            eventType: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
            windowLocation: window.location.href,
          });

          // 이미 resolve되었으면 무시
          if (resolved) {
            console.log('[WaitForCondition] Already resolved, ignoring trigger');
            return;
          }

          if (confirmResolve) {
            confirmResolve();
          }
        };

        window.addEventListener('8g-trigger-confirmation', handleTriggerConfirmation);

        // cleanup 시 리스너 제거
        const originalCleanup = cleanup;
        cleanup = () => {
          window.removeEventListener('8g-trigger-confirmation', handleTriggerConfirmation);
          originalCleanup();
        };
      }

      // manual 전용 모드일 경우 확인 또는 타임아웃 대기
      if (mode === 'manual' && !hasAutoConditions) {
        // 아무것도 하지 않음, 사용자 확인이나 타임아웃만 대기
      }
    });
  } catch (error) {
    console.error('[WaitForCondition] Error:', error);
    return {
      hasError: true,
      message:
        error instanceof Error ? error.message : 'Unknown error in wait-for-condition handler',
      data: {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
