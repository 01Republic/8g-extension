import React, { useState, useEffect, useRef } from 'react';

export type NotificationUrgency = 'low' | 'medium' | 'high';

export interface FloatingNotificationButtonProps {
  id: string;
  message: string;
  badge?: number;
  urgency?: NotificationUrgency;
  onClick: () => void;
  onDismiss?: () => void;
}

const FloatingNotificationButton: React.FC<FloatingNotificationButtonProps> = ({
  id,
  message,
  badge = 0,
  urgency = 'medium',
  onClick,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: 150 }); // StatusUI 아래 기본 위치
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // 자동 위치 조정 (다른 UI와 충돌 방지)
  useEffect(() => {
    const checkCollision = () => {
      // StatusUI 또는 다른 플로팅 요소와 충돌 체크
      const existingElements = document.querySelectorAll('[data-floating-element]');
      let adjustedY = 150;
      
      existingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (Math.abs(rect.bottom - window.innerHeight + adjustedY) < 80) {
          adjustedY += 80; // 충돌 시 아래로 이동
        }
      });
      
      setPosition(prev => ({ ...prev, y: adjustedY }));
    };

    checkCollision();
  }, []);

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;
    
    setPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 클릭 핸들러
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      onClick();
    }
  };

  // 닫기 핸들러
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // 긴급도에 따른 색상
  const getUrgencyColor = () => {
    switch (urgency) {
      case 'high':
        return {
          bg: 'linear-gradient(135deg, #ff4757, #ff6b81)',
          shadow: 'rgba(255, 71, 87, 0.4)',
          pulse: 'rgba(255, 71, 87, 0.6)',
        };
      case 'medium':
        return {
          bg: 'linear-gradient(135deg, #667eea, #764ba2)',
          shadow: 'rgba(102, 126, 234, 0.4)',
          pulse: 'rgba(102, 126, 234, 0.6)',
        };
      case 'low':
        return {
          bg: 'linear-gradient(135deg, #48dbfb, #0abde3)',
          shadow: 'rgba(72, 219, 251, 0.4)',
          pulse: 'rgba(72, 219, 251, 0.6)',
        };
    }
  };

  const colors = getUrgencyColor();

  // 스타일
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    right: `${position.x}px`,
    bottom: `${position.y}px`,
    zIndex: 2147483645, // StatusUI보다 낮게
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: colors.bg,
    boxShadow: `0 4px 20px ${colors.shadow}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    transition: 'transform 0.3s ease',
  };

  const pulseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    background: colors.pulse,
    animation: urgency === 'high' 
      ? 'pulse-urgent 1s ease-in-out infinite' 
      : 'pulse-normal 2s ease-in-out infinite',
    pointerEvents: 'none',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '24px',
    color: 'white',
    position: 'relative',
    zIndex: 1,
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ff4757',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    display: badge > 0 ? 'block' : 'none',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '70px',
    right: '0',
    background: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
    opacity: isHovered && !isDragging ? 1 : 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s ease',
    transform: 'translateX(20%)',
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    display: isHovered ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  // 애니메이션 스타일
  const animationStyles = `
    @keyframes pulse-normal {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.3);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 0.8;
      }
    }

    @keyframes pulse-urgent {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.5);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 0.8;
      }
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `;

  // 아이콘 선택
  const getIcon = () => {
    switch (urgency) {
      case 'high': return '🔔';
      case 'medium': return '📋';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div 
        ref={buttonRef}
        data-floating-element="notification"
        data-notification-id={id}
        style={containerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        <div style={buttonStyle} onClick={handleClick}>
          <div style={pulseStyle} />
          <span style={iconStyle}>{getIcon()}</span>
          {badge > 0 && <div style={badgeStyle}>{badge > 9 ? '9+' : badge}</div>}
          {onDismiss && (
            <button 
              style={closeButtonStyle}
              onClick={handleDismiss}
              title="닫기"
            >
              ✕
            </button>
          )}
        </div>
        <div style={tooltipStyle}>{message}</div>
      </div>
    </>
  );
};

export default FloatingNotificationButton;