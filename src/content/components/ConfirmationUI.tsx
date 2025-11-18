import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ConfirmationUIVariant = 'default' | 'warning' | 'info';
export type ConfirmationUIIcon = 'shield' | 'click' | 'alert';

interface ConfirmationUIProps {
  message: string;
  buttonText: string;
  position: 'top' | 'bottom';
  variant?: ConfirmationUIVariant;
  icon?: ConfirmationUIIcon;
  showClose?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  visible: boolean;
}

/**
 * ActionPrompt 스타일의 확인 UI 컴포넌트
 * 상단 전체 너비 바 형태로 사용자 액션 요청을 강조
 * variant와 아이콘을 지원하여 다양한 상황에 대응
 */
export function ConfirmationUI({
  message,
  buttonText,
  position = 'top',
  variant = 'default',
  icon = 'alert',
  showClose = true,
  onConfirm,
  onClose,
  visible,
}: ConfirmationUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
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
    setTimeout(() => {
      onConfirm();
    }, 200);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 200);
  };

  const getIcon = () => {
    const iconMap = {
      shield: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      click: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      alert: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    };
    return iconMap[icon];
  };

  const getVariantStyles = () => {
    const variants = {
      default: {
        bg: '#3b82f6', // blue-500
        iconColor: '#ffffff',
        textColor: '#ffffff',
        descColor: '#dbeafe', // blue-50
      },
      warning: {
        bg: '#f59e0b', // amber-500
        iconColor: '#ffffff',
        textColor: '#ffffff',
        descColor: '#fef3c7', // amber-50
      },
      info: {
        bg: '#a855f7', // purple-500
        iconColor: '#ffffff',
        textColor: '#ffffff',
        descColor: '#f3e8ff', // purple-50
      },
    };
    return variants[variant];
  };

  const styles = getVariantStyles();
  const positionStyle = position === 'top' ? { top: 0 } : { bottom: 0 };

  // 디버깅: position 값 확인
  console.log('[ConfirmationUI] Rendering with position:', position, 'positionStyle:', positionStyle);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    ...positionStyle,
    zIndex: 2147483647,
    backgroundColor: styles.bg,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    transform: isAnimating
      ? 'translateY(0)'
      : position === 'top'
        ? 'translateY(-100%)'
        : 'translateY(100%)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const innerContainerStyle: React.CSSProperties = {
    maxWidth: '448px',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: styles.textColor,
    fontWeight: 500,
    flex: 1,
    minWidth: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    margin: '4px 0 0 0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: styles.descColor,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    outline: 'none',
    flexShrink: 0,
  };

  return createPortal(
    <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
      <div style={innerContainerStyle}>
        {/* Icon */}
        <div style={{ flexShrink: 0, color: styles.iconColor }}>{getIcon()}</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={messageStyle}>{getDisplayMessage()}</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Complete Button */}
          {buttonText && (
            <button
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onClick={handleConfirm}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {buttonText}
            </button>
          )}

          {/* Close Button */}
          {showClose && onClose && (
            <button
              style={closeButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={handleClose}
              aria-label="닫기"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
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
    position: 'top' | 'bottom';
    variant: ConfirmationUIVariant;
    icon: ConfirmationUIIcon;
    showClose: boolean;
    onConfirm: (() => void) | null;
    onClose: (() => void) | null;
  }>({
    visible: false,
    message: '',
    buttonText: '',
    position: 'top',
    variant: 'default',
    icon: 'alert',
    showClose: true,
    onConfirm: null,
    onClose: null,
  });

  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent;
      const {
        message,
        buttonText,
        position = 'top',
        variant = 'default',
        icon = 'alert',
        showClose = true,
        onConfirm,
        onClose,
      } = customEvent.detail || {};

      console.log('[ConfirmationUI] Show event received:', {
        message,
        buttonText,
        position,
        variant,
        icon,
        showClose,
      });

      setUiState({
        visible: true,
        message,
        buttonText,
        position,
        variant,
        icon,
        showClose,
        onConfirm: onConfirm || null,
        onClose: onClose || null,
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

  const handleClose = () => {
    console.log('[ConfirmationUI] User closed');
    if (uiState.onClose) {
      uiState.onClose();
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
      variant={uiState.variant}
      icon={uiState.icon}
      showClose={uiState.showClose}
      onConfirm={handleConfirm}
      onClose={handleClose}
      visible={uiState.visible}
    />
  );
}
