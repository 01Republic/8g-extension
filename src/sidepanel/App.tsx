import React, { useState, useEffect } from 'react';
import StatusChecker from './components/StatusChecker';
import { SidePanelStatus, CheckStatusPayload } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<SidePanelStatus>('idle');
  const [currentCheck, setCurrentCheck] = useState<CheckStatusPayload | null>(null);
  const [message, setMessage] = useState<string>('준비 중...');

  useEffect(() => {
    // Background script로부터 메시지 수신
    const handleMessage = (message: any) => {
      console.log('SidePanel received message:', message);
      
      if (message.type === 'OPEN_SIDE_PANEL') {
        setCurrentCheck(message.payload);
        setStatus('checking');
        setMessage(message.payload.title || '상태 확인 중...');
      } else if (message.type === 'UPDATE_SIDE_PANEL') {
        setStatus(message.payload.status);
        setMessage(message.payload.message);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // 초기 상태 요청
    chrome.runtime.sendMessage({ type: 'SIDE_PANEL_READY' });

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleAction = (action: 'confirm' | 'cancel' | 'retry') => {
    chrome.runtime.sendMessage({
      type: 'SIDE_PANEL_ACTION',
      payload: {
        action,
        checkType: currentCheck?.checkType,
      },
    });

    if (action === 'cancel') {
      // 최소화 처리
      window.close();
    }
  };

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <h1>8G Extension</h1>
        <span className="status-badge" data-status={status}>
          {status === 'checking' && '확인 중'}
          {status === 'success' && '완료'}
          {status === 'error' && '오류'}
          {status === 'waiting' && '대기 중'}
          {status === 'idle' && '준비'}
        </span>
      </header>

      <main className="sidepanel-content">
        {currentCheck ? (
          <StatusChecker
            checkType={currentCheck.checkType}
            title={currentCheck.title}
            description={currentCheck.description}
            status={status}
            message={message}
            onAction={handleAction}
          />
        ) : (
          <div className="empty-state">
            <p>워크플로우 실행을 기다리는 중입니다...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;