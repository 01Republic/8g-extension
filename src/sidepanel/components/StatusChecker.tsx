import React, { useState, useEffect } from 'react';
import { CheckStatusRequest, CheckStatusResult } from '../types';

interface StatusCheckerProps {
  request: CheckStatusRequest;
  onComplete: (result: Omit<CheckStatusResult, 'notificationId'>) => void;
  onCancel: () => void;
}

const StatusChecker: React.FC<StatusCheckerProps> = ({ request, onComplete, onCancel }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ success: boolean; message: string } | null>(null);

  const performCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const result = await chrome.tabs.sendMessage(tab.id, {
        type: 'PERFORM_STATUS_CHECK',
        payload: { checkType: request.checkType },
      });

      setCheckResult(result);
      
      if (result.success) {
        setTimeout(() => {
          onComplete({
            success: true,
            data: result.data,
            message: result.message,
          });
        }, 1500);
      }
    } catch (error) {
      setCheckResult({
        success: false,
        message: error instanceof Error ? error.message : 'Check failed',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setCheckResult(null);
    performCheck();
  };

  const handleConfirm = () => {
    onComplete({
      success: true,
      message: 'User confirmed',
    });
  };

  const getIcon = () => {
    switch (request.checkType) {
      case 'login': return '🔐';
      case 'pageLoad': return '📄';
      case 'element': return '🎯';
      case 'custom': return '⚙️';
      default: return '📋';
    }
  };

  const getCheckTypeLabel = () => {
    switch (request.checkType) {
      case 'login': return '로그인 상태';
      case 'pageLoad': return '페이지 로딩';
      case 'element': return '요소 확인';
      case 'custom': return '사용자 정의';
      default: return '상태 확인';
    }
  };

  return (
    <div className="status-checker">
      <div className="check-header">
        <span className="check-icon">{getIcon()}</span>
        <div className="check-info">
          <h2>{request.title}</h2>
          {request.description && <p className="check-description">{request.description}</p>}
        </div>
      </div>

      <div className="check-body">
        <div className="check-type-badge">{getCheckTypeLabel()}</div>

        {checkResult && (
          <div className={`check-result ${checkResult.success ? 'success' : 'failure'}`}>
            <span className="result-icon">{checkResult.success ? '✅' : '❌'}</span>
            <span className="result-message">{checkResult.message}</span>
          </div>
        )}

        <div className="check-actions">
          <button
            className="btn btn-primary"
            onClick={performCheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <span className="spinner"></span>
                확인 중...
              </>
            ) : (
              '상태 확인'
            )}
          </button>

          {checkResult && !checkResult.success && request.options?.retryable && (
            <button className="btn btn-secondary" onClick={handleRetry}>
              다시 시도
            </button>
          )}

          <button className="btn btn-success" onClick={handleConfirm}>
            확인 완료
          </button>

          <button className="btn btn-danger" onClick={onCancel}>
            취소
          </button>
        </div>

        {request.options?.timeoutMs && (
          <TimeoutIndicator timeoutMs={request.options.timeoutMs} onTimeout={onCancel} />
        )}
      </div>
    </div>
  );
};

const TimeoutIndicator: React.FC<{ timeoutMs: number; onTimeout: () => void }> = ({
  timeoutMs,
  onTimeout,
}) => {
  const [remainingTime, setRemainingTime] = useState(timeoutMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeoutMs, onTimeout]);

  const seconds = Math.ceil(remainingTime / 1000);
  const progressPercentage = (remainingTime / timeoutMs) * 100;

  return (
    <div className="timeout-indicator">
      <div className="timeout-bar">
        <div className="timeout-progress" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      <span className="timeout-text">{seconds}초 남음</span>
    </div>
  );
};

export default StatusChecker;