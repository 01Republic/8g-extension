import React, { useState, useEffect } from 'react';
import { SidePanelStatus } from '../types';

interface LoginStatusProps {
  status: SidePanelStatus;
  message: string;
}

const LoginStatus: React.FC<LoginStatusProps> = ({ status, message }) => {
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    // 로그인 성공 시 계정 정보를 받아옴
    if (status === 'success') {
      chrome.runtime.sendMessage({ type: 'GET_ACCOUNT_INFO' }, (response) => {
        if (response?.accountInfo) {
          setAccountInfo(response.accountInfo);
        }
      });
    }
  }, [status]);

  return (
    <div className="login-status">
      <div className="status-icon-container">
        {status === 'checking' && (
          <div className="checking-animation">
            <div className="pulse-ring"></div>
            <svg className="user-icon" viewBox="0 0 24 24" width="48" height="48">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}

        {status === 'success' && (
          <div className="success-animation">
            <svg className="check-icon" viewBox="0 0 24 24" width="48" height="48">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#4CAF50" />
            </svg>
          </div>
        )}

        {status === 'error' && (
          <div className="error-animation">
            <svg className="error-icon" viewBox="0 0 24 24" width="48" height="48">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#F44336" />
            </svg>
          </div>
        )}
      </div>

      <div className="status-text">
        <p className="main-message">{message}</p>
        
        {status === 'success' && accountInfo && (
          <div className="account-info">
            <p className="account-email">{accountInfo.email}</p>
            <p className="account-name">{accountInfo.name}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-help">
            <p className="help-text">로그인 후 다시 시도해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginStatus;