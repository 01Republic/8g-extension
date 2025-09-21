import { describe, it, expect, beforeEach, vi } from 'vitest';
import { synchronizedLock } from './synchronizedLock';

describe('SynchronizedLock 테스트', () => {
  beforeEach(() => {
    // 각 테스트 전에 락 상태 초기화
    if (synchronizedLock.isCurrentlyLocked()) {
      synchronizedLock.releaseLock();
    }
  });

  describe('기본 락 동작', () => {
    it('락 획득과 해제', async () => {
      expect(synchronizedLock.isCurrentlyLocked()).toBe(false);

      await synchronizedLock.getLock();
      expect(synchronizedLock.isCurrentlyLocked()).toBe(true);

      synchronizedLock.releaseLock();
      expect(synchronizedLock.isCurrentlyLocked()).toBe(false);
    });

    it('락 안 잡혀있는데 해제하면 경고', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      synchronizedLock.releaseLock();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SynchronizedLock] Attempting to release an unlocked lock'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('대기열 관리', () => {
    it('락 잡혀있을 때 다음 요청은 대기', async () => {
      await synchronizedLock.getLock();
      expect(synchronizedLock.getQueueLength()).toBe(0);

      // 두 번째 락 요청은 대기상태
      const secondLockPromise = synchronizedLock.getLock();
      expect(synchronizedLock.getQueueLength()).toBe(1);

      // 첫 번째 락 해제하면 두 번째 락이 자동으로 획득됨
      synchronizedLock.releaseLock();
      await secondLockPromise;

      expect(synchronizedLock.isCurrentlyLocked()).toBe(true);
      expect(synchronizedLock.getQueueLength()).toBe(0);
    });

    it('여러 요청 대기열 순서대로 처리', async () => {
      const executionOrder: number[] = [];

      // 첫 번째 락 획득
      await synchronizedLock.getLock();

      // 여러 락 요청을 대기열에 추가
      const promises = [
        synchronizedLock.getLock().then(() => executionOrder.push(1)),
        synchronizedLock.getLock().then(() => executionOrder.push(2)),
        synchronizedLock.getLock().then(() => executionOrder.push(3)),
      ];

      expect(synchronizedLock.getQueueLength()).toBe(3);

      // 순차적으로 락 해제
      synchronizedLock.releaseLock(); // 1번 실행
      await new Promise((resolve) => setTimeout(resolve, 0));
      synchronizedLock.releaseLock(); // 2번 실행
      await new Promise((resolve) => setTimeout(resolve, 0));
      synchronizedLock.releaseLock(); // 3번 실행

      await Promise.all(promises);
      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('실제 사용 시나리오', () => {
    it('동시 블록 실행 방지', async () => {
      const executionLog: string[] = [];

      const executeBlock = async (blockName: string) => {
        await synchronizedLock.getLock();
        try {
          executionLog.push(`${blockName} 시작`);
          await new Promise((resolve) => setTimeout(resolve, 10));
          executionLog.push(`${blockName} 완료`);
        } finally {
          synchronizedLock.releaseLock();
        }
      };

      // 동시에 여러 블록 실행
      await Promise.all([executeBlock('블록1'), executeBlock('블록2'), executeBlock('블록3')]);

      // 블록들이 순차적으로 실행되었는지 확인
      expect(executionLog).toEqual([
        '블록1 시작',
        '블록1 완료',
        '블록2 시작',
        '블록2 완료',
        '블록3 시작',
        '블록3 완료',
      ]);
    });

    it('에러 발생해도 락 해제됨', async () => {
      const executeWithError = async () => {
        await synchronizedLock.getLock();
        try {
          throw new Error('테스트 에러');
        } finally {
          synchronizedLock.releaseLock();
        }
      };

      await expect(executeWithError()).rejects.toThrow('테스트 에러');
      expect(synchronizedLock.isCurrentlyLocked()).toBe(false);
    });
  });
});
