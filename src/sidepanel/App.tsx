import React, { useState, useEffect } from 'react';
import { CheckStatusRequest, CheckStatusResult } from './types';
import StatusChecker from './components/StatusChecker';

const App: React.FC = () => {
  const [currentCheck, setCurrentCheck] = useState<CheckStatusRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'SIDE_PANEL_READY' }, (response) => {
      if (response?.hasPendingCheck) {
        setCurrentCheck(response.check);
      }
      setIsLoading(false);
    });

    const messageListener = (message: any) => {
      if (message.type === 'SHOW_CHECK_STATUS') {
        setCurrentCheck(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleCheckComplete = (result: Omit<CheckStatusResult, 'notificationId'>) => {
    if (!currentCheck) return;

    const fullResult: CheckStatusResult = {
      ...result,
      notificationId: currentCheck.notificationId,
    };

    chrome.runtime.sendMessage({
      type: 'CHECK_STATUS_RESULT',
      payload: fullResult,
    });

    setCurrentCheck(null);
    
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'SIDE_PANEL_READY' }, (response) => {
        if (response?.hasPendingCheck) {
          setCurrentCheck(response.check);
        }
      });
    }, 100);
  };

  const handleCancel = () => {
    if (!currentCheck) return;

    handleCheckComplete({
      success: false,
      message: 'User cancelled the check',
    });
  };

  if (isLoading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!currentCheck) {
    return (
      <div className="app-container idle">
        <div className="brand-header">
          <img src="/public/logo.png" alt="8G Extension" className="logo" />
          <h1>8G Extension</h1>
        </div>
        <div className="idle-content">
          <p className="idle-message">대기 중인 작업이 없습니다</p>
          <p className="idle-description">
            워크플로우 실행 중 확인이 필요한 상태가 발생하면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="brand-header">
        <img src="/public/logo.png" alt="8G Extension" className="logo" />
        <h1>8G Extension</h1>
      </div>
      <StatusChecker
        request={currentCheck}
        onComplete={handleCheckComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default App;