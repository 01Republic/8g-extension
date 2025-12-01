import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ExecutionStatusUIProps {
  visible: boolean;
}

/**
 * 워크플로우 실행 중 사용자 인터랙션 차단 Hook
 * - 사용자 직접 클릭/타이핑 차단 (isTrusted: true)
 * - 워크플로우 CDP/Fallback 이벤트는 통과 (isTrusted: false or background 실행)
 */
function useEventBlocker(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const eventTypes = ['mousedown', 'mouseup', 'click', 'keydown', 'keyup'];

    const blockEvent = (event: Event) => {
      if (event.isTrusted) {
        // 사용자 직접 이벤트만 차단
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      // isTrusted: false면 통과 (워크플로우 Fallback 이벤트)
    };

    // Main document 이벤트 차단
    eventTypes.forEach((type) => {
      document.addEventListener(type, blockEvent, { capture: true });
    });

    // Same-origin iframe 이벤트 차단
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          eventTypes.forEach((type) => {
            iframeDoc.addEventListener(type, blockEvent, { capture: true });
          });
        }
      } catch {
        // Cross-origin iframe은 브라우저 보안상 접근 불가 (무시)
      }
    });

    // Cleanup: 워크플로우 종료 시 모든 리스너 제거
    return () => {
      eventTypes.forEach((type) => {
        document.removeEventListener(type, blockEvent, { capture: true });
      });

      iframes.forEach((iframe) => {
        try {
          const iframeDoc = iframe.contentDocument;
          if (iframeDoc) {
            eventTypes.forEach((type) => {
              iframeDoc.removeEventListener(type, blockEvent, { capture: true });
            });
          }
        } catch {}
      });
    };
  }, [enabled]);
}

export function ExecutionStatusUI({ visible }: ExecutionStatusUIProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // 워크플로우 실행 중 사용자 인터랙션 차단
  useEventBlocker(visible);

  useEffect(() => {
    // 커서 스타일을 body에 적용
    if (visible) {
      // 완전한 보라색 원형 아이콘 (테두리 + 중앙 점)
      const cursorSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='none' stroke='%23a855f7' stroke-width='3'/><circle cx='12' cy='12' r='4' fill='%23a855f7'/></svg>`;
      document.body.style.cursor = `url("${cursorSvg}") 12 12, wait`;
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.cursor = '';
    };
  }, [visible]);

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