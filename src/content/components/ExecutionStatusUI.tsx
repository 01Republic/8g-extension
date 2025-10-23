import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ExecutionStatusUIProps {
  visible: boolean;
  message?: string;
}

/**
 * 워크플로우 실행 중 상태를 표시하는 애니메이션 UI
 * 왼쪽 상단에 고양이가 걸어가는 애니메이션과 함께 표시
 */
export function ExecutionStatusUI({ visible, message = '실행 중' }: ExecutionStatusUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 2147483647,
    backgroundColor: '#ffffff',
    border: '2px solid #818cf8',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '200px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    transform: isAnimating ? 'scale(1)' : 'scale(0.9)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
  };

  const catContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '40px',
    height: '30px',
    overflow: 'hidden',
  };

  const catStyle: React.CSSProperties = {
    fontSize: '24px',
    animation: 'walkCat 2s ease-in-out infinite',
  };

  const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const dotsStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '20px',
  };

  return createPortal(
    <>
      <style>
        {`
          @keyframes walkCat {
            0%, 100% {
              transform: translateX(0px);
            }
            50% {
              transform: translateX(10px);
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
        <div style={catContainerStyle}>
          <span style={catStyle}>🐱</span>
        </div>
        <p style={messageStyle}>
          {message}
          <span style={dotsStyle}>
            <span className="dot-1">.</span>
            <span className="dot-2">.</span>
            <span className="dot-3">.</span>
          </span>
        </p>
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
  }>({
    visible: false,
    message: '실행 중',
  });

  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message } = customEvent.detail || {};

      console.log('[ExecutionStatusUI] Show event received:', { message });

      setUiState({
        visible: true,
        message: message || '실행 중',
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

  return <ExecutionStatusUI visible={uiState.visible} message={uiState.message} />;
}

