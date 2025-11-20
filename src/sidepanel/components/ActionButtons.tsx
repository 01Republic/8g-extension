import React from 'react';
import { SidePanelStatus } from '../types';

interface ActionButtonsProps {
  status: SidePanelStatus;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  status,
  onConfirm,
  onCancel,
  onRetry,
}) => {
  return (
    <div className="action-buttons">
      {status === 'checking' && (
        <>
          <button className="btn btn-primary" onClick={onConfirm}>
            확인
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            닫기
          </button>
        </>
      )}

      {status === 'success' && (
        <button className="btn btn-success" onClick={onConfirm}>
          계속 진행
        </button>
      )}

      {status === 'error' && (
        <>
          <button className="btn btn-warning" onClick={onRetry}>
            다시 시도
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            닫기
          </button>
        </>
      )}

      {status === 'waiting' && (
        <>
          <button className="btn btn-primary" onClick={onConfirm} disabled>
            대기 중...
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            취소
          </button>
        </>
      )}
    </div>
  );
};

export default ActionButtons;