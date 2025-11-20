import React from 'react';
import LoginStatus from './LoginStatus';
import ActionButtons from './ActionButtons';
import { SidePanelStatus, CheckType } from '../types';

interface StatusCheckerProps {
  checkType: CheckType;
  title: string;
  description?: string;
  status: SidePanelStatus;
  message: string;
  onAction: (action: 'confirm' | 'cancel' | 'retry') => void;
}

const StatusChecker: React.FC<StatusCheckerProps> = ({
  checkType,
  title,
  description,
  status,
  message,
  onAction,
}) => {
  return (
    <div className="status-checker">
      <div className="status-header">
        <h2>{title}</h2>
        {description && <p className="description">{description}</p>}
      </div>

      <div className="status-content">
        {checkType === 'login' && <LoginStatus status={status} message={message} />}
        
        {checkType === 'pageLoad' && (
          <div className="page-load-status">
            <div className="status-icon">
              {status === 'checking' && <span className="spinner">⟳</span>}
              {status === 'success' && <span className="check">✓</span>}
              {status === 'error' && <span className="cross">✗</span>}
            </div>
            <p className="status-message">{message}</p>
          </div>
        )}

        {checkType === 'element' && (
          <div className="element-status">
            <p className="status-message">{message}</p>
            {status === 'checking' && (
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            )}
          </div>
        )}

        {checkType === 'custom' && (
          <div className="custom-status">
            <p className="status-message">{message}</p>
          </div>
        )}
      </div>

      <ActionButtons 
        status={status}
        onConfirm={() => onAction('confirm')}
        onCancel={() => onAction('cancel')}
        onRetry={() => onAction('retry')}
      />
    </div>
  );
};

export default StatusChecker;