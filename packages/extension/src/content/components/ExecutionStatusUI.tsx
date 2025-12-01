import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ExecutionStatusUIProps {
  visible: boolean;
}

export function ExecutionStatusUI({ visible }: ExecutionStatusUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Add keyframes animation to document head
    const styleId = 'execution-status-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes wave-flow {
          0% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.9),
              inset 0 0 0 8px rgba(168, 85, 247, 0.5),
              inset 0 0 0 16px rgba(168, 85, 247, 0.2);
          }
          25% {
            box-shadow:
              inset 0 0 0 4px rgba(168, 85, 247, 1),
              inset 0 0 0 10px rgba(168, 85, 247, 0.6),
              inset 0 0 0 18px rgba(168, 85, 247, 0.25);
          }
          50% {
            box-shadow:
              inset 0 0 0 3px rgba(168, 85, 247, 0.95),
              inset 0 0 0 12px rgba(168, 85, 247, 0.7),
              inset 0 0 0 20px rgba(168, 85, 247, 0.3);
          }
          75% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.85),
              inset 0 0 0 9px rgba(168, 85, 247, 0.55),
              inset 0 0 0 17px rgba(168, 85, 247, 0.22);
          }
          100% {
            box-shadow:
              inset 0 0 0 2px rgba(168, 85, 247, 0.9),
              inset 0 0 0 8px rgba(168, 85, 247, 0.5),
              inset 0 0 0 16px rgba(168, 85, 247, 0.2);
          }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  useEffect(() => {
    setIsAnimating(visible);
  }, [visible]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2147483647,
    pointerEvents: 'none',
    borderRadius: '16px',
    boxSizing: 'border-box',
    boxShadow: isAnimating
      ? 'inset 0 0 0 2px rgba(168, 85, 247, 0.9), inset 0 0 0 8px rgba(168, 85, 247, 0.5), inset 0 0 0 16px rgba(168, 85, 247, 0.2)'
      : 'none',
    animation: isAnimating ? 'wave-flow 3s ease-in-out infinite' : 'none',
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return createPortal(
    <div style={containerStyle} />,
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