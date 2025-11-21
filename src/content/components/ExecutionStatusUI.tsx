import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ExecutionStatusType = 'loading' | 'success' | 'error';
export type ExecutionStatusIcon = 'login' | 'download' | 'mail' | 'default';

interface ExecutionStatusUIProps {
  visible: boolean;
  message?: string;
  statusType?: ExecutionStatusType;
  icon?: ExecutionStatusIcon;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * 워크플로우 실행 상태를 표시하는 플로팅 UI 컴포넌트
 * WorkflowStatus 스타일: 우측 하단 플로팅 카드 형태
 * 로딩, 성공, 오류 상태를 시각화하고 부드러운 애니메이션 제공
 */
export function ExecutionStatusUI({
  visible,
  message = '실행 중',
  statusType = 'loading',
  icon = 'default',
  position = 'bottom-right',
}: ExecutionStatusUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  if (!visible) return null;

  const positionStyles = {
    'bottom-right': { bottom: '24px', right: '24px' },
    'bottom-left': { bottom: '24px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
  };

  const getBgColor = () => {
    if (statusType === 'success') return { bg: '#f0fdf4', border: '#bbf7d0' }; // green-50, green-200
    if (statusType === 'error') return { bg: '#fef2f2', border: '#fecaca' }; // red-50, red-200
    return { bg: '#ffffff', border: '#e5e7eb' }; // white, gray-200
  };

  const getIcon = () => {
    if (statusType === 'success') {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    }
    if (statusType === 'error') {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }

    // Loading state - show custom icon or default loader
    const iconMap = {
      login: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      download: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      mail: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      default: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin"
        >
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
      ),
    };
    return iconMap[icon];
  };

  const colors = getBgColor();

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    zIndex: 2147483647,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '200px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    transform: isAnimating ? 'scale(1)' : 'scale(0.9)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
    backdropFilter: 'blur(8px)',
    pointerEvents: 'auto',
  };

  const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    flex: 1,
    minWidth: 0,
  };

  return createPortal(
    <>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes dotBlink {
            0%, 20% {
              opacity: 0;
            }
            40% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          .dot-1 {
            animation: dotBlink 1.5s infinite;
            animation-delay: 0s;
          }

          .dot-2 {
            animation: dotBlink 1.5s infinite;
            animation-delay: 0.3s;
          }

          .dot-3 {
            animation: dotBlink 1.5s infinite;
            animation-delay: 0.6s;
          }
        `}
      </style>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{getIcon()}</div>
        <div style={messageStyle}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>
        {statusType === 'loading' && (
          <div style={{ flexShrink: 0, display: 'flex', gap: '4px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                animation: 'dotBlink 1.5s infinite',
                animationDelay: '0s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                animation: 'dotBlink 1.5s infinite',
                animationDelay: '0.2s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                animation: 'dotBlink 1.5s infinite',
                animationDelay: '0.4s',
              }}
            />
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

/**
 * 커스텀 이벤트를 수신하고 실행 상태 UI를 관리하는 컨테이너 컴포넌트
 */
export function ExecutionStatusUIContainer() {
  const [uiState, setUiState] = useState<{
    visible: boolean;
    message: string;
    statusType: ExecutionStatusType;
    icon: ExecutionStatusIcon;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  }>({
    visible: false,
    message: '실행 중',
    statusType: 'loading',
    icon: 'default',
    position: 'bottom-right',
  });

  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent;
      const {
        message,
        statusType = 'loading',
        icon = 'default',
        position = 'bottom-right',
      } = customEvent.detail || {};

      console.log('[ExecutionStatusUI] Show event received:', {
        message,
        statusType,
        icon,
        position,
      });

      setUiState({
        visible: true,
        message: message || '실행 중',
        statusType,
        icon,
        position,
      });
    };

    const handleHide = () => {
      console.log('[ExecutionStatusUI] Hide event received');
      setUiState((prev) => ({
        ...prev,
        visible: false,
      }));
    };

    window.addEventListener('8g-show-execution-status', handleShow);
    window.addEventListener('8g-hide-execution-status', handleHide);

    return () => {
      window.removeEventListener('8g-show-execution-status', handleShow);
      window.removeEventListener('8g-hide-execution-status', handleHide);
    };
  }, []);

  return (
    <ExecutionStatusUI
      visible={uiState.visible}
      message={uiState.message}
      statusType={uiState.statusType}
      icon={uiState.icon}
      position={uiState.position}
    />
  );
}
