import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getTranslation, getCurrentLocale } from '../../locales';

interface ExecutionStatusUIProps {
  visible: boolean;
}

export function ExecutionStatusUI({ visible }: ExecutionStatusUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const t = (key: string) => {
    try {
      return getTranslation(key, getCurrentLocale());
    } catch (error) {
      console.warn('Translation failed:', key, error);
      return key;
    }
  };

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
    left: 0,
    right: 0,
    top: 0,
    zIndex: 2147483647,
    backgroundColor: '#10b981',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
    transform: isAnimating ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const innerContainerStyle: React.CSSProperties = {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const messageStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#ffffff',
    fontWeight: 500,
  };

  return createPortal(
    <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
      <div style={innerContainerStyle}>
        <div style={{ flexShrink: 0, color: '#ffffff' }}>
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
        </div>
        <p style={messageStyle}>{t('ui.workflow.executing')}</p>
      </div>
    </div>,
    document.body
  );
}

export function ExecutionStatusUIContainer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleShow = () => setVisible(true);
    const handleHide = () => setVisible(false);

    window.addEventListener('8g-show-execution-status', handleShow);
    window.addEventListener('8g-hide-execution-status', handleHide);

    return () => {
      window.removeEventListener('8g-show-execution-status', handleShow);
      window.removeEventListener('8g-hide-execution-status', handleHide);
    };
  }, []);

  return <ExecutionStatusUI visible={visible} />;
}