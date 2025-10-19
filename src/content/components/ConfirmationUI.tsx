import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationUIProps {
  message: string;
  buttonText: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onConfirm: () => void;
  visible: boolean;
}

const positionStyles = {
  'top-left': {
    top: '20px',
    left: '20px',
  },
  'top-right': {
    top: '20px',
    right: '20px',
  },
  'bottom-left': {
    bottom: '20px',
    left: '20px',
  },
  'bottom-right': {
    bottom: '20px',
    right: '20px',
  },
};

/**
 * Floating 확인 UI 컴포넌트
 * 사용자에게 메시지와 확인 버튼 표시
 */
export function ConfirmationUI({
  message,
  buttonText,
  position,
  onConfirm,
  visible,
}: ConfirmationUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      // 마운트 후 애니메이션 트리거
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  // URL에 따라 메시지 결정
  const getDisplayMessage = () => {
    const currentUrl = window.location.href.toLowerCase();
    const isLoginPage = currentUrl.includes('login') || currentUrl.includes('signin');

    if (isLoginPage) {
      return '로그인 완료 후 확인 버튼을 클릭해주세요.';
    }
    return message;
  };

  if (!visible) return null;

  const handleConfirm = () => {
    setIsAnimating(false);
    // 애니메이션 완료 후 onConfirm 호출
    setTimeout(() => {
      onConfirm();
    }, 200);
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    zIndex: 2147483647, // Maximum z-index
    backgroundColor: '#ffffff',
    border: '2px solid #4f46e5',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '280px',
    maxWidth: '400px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    transform: isAnimating ? 'scale(1)' : 'scale(0.9)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
  };

  const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1f2937',
    fontWeight: 500,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    outline: 'none',
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: '#4338ca',
  };

  return createPortal(
    <div
      style={containerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <p style={messageStyle}>{getDisplayMessage()}</p>
      <button
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor!;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor!;
        }}
        onClick={handleConfirm}
      >
        {buttonText}
      </button>
    </div>,
    document.body
  );
}

/**
 * 커스텀 이벤트를 수신하고 확인 UI 상태를 관리하는 컨테이너 컴포넌트
 */
export function ConfirmationUIContainer() {
  const [uiState, setUiState] = useState<{
    visible: boolean;
    message: string;
    buttonText: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    onConfirm: (() => void) | null;
  }>({
    visible: false,
    message: '',
    buttonText: '',
    position: 'bottom-right',
    onConfirm: null,
  });

  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, buttonText, position, onConfirm } = customEvent.detail;

      console.log('[ConfirmationUI] Show event received:', { message, buttonText, position });

      setUiState({
        visible: true,
        message,
        buttonText,
        position,
        onConfirm,
      });
    };

    const handleHide = () => {
      console.log('[ConfirmationUI] Hide event received');
      setUiState((prev) => ({
        ...prev,
        visible: false,
      }));
    };

    window.addEventListener('8g-show-confirmation-ui', handleShow);
    window.addEventListener('8g-hide-confirmation-ui', handleHide);

    return () => {
      window.removeEventListener('8g-show-confirmation-ui', handleShow);
      window.removeEventListener('8g-hide-confirmation-ui', handleHide);
    };
  }, []);

  const handleConfirm = () => {
    console.log('[ConfirmationUI] User confirmed');
    if (uiState.onConfirm) {
      uiState.onConfirm();
    }
    setUiState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  return (
    <ConfirmationUI
      message={uiState.message}
      buttonText={uiState.buttonText}
      position={uiState.position}
      onConfirm={handleConfirm}
      visible={uiState.visible}
    />
  );
}
