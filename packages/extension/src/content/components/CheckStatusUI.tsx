import React, { useState } from 'react';
import { performStatusCheck } from '@/blocks/CheckStatusBlock';

interface CheckStatusUIProps {
  checkType: 'login' | 'pageLoad' | 'element' | 'custom';
  title: string;
  description?: string;
  onConfirm: (result: any) => void;
  onCancel: () => void;
}

const CheckStatusUI: React.FC<CheckStatusUIProps> = ({
  checkType,
  title,
  description,
  onConfirm,
  onCancel,
}) => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 30, y: 120 }); // StatusUI 아래 위치
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleCheck = async () => {
    setStatus('checking');
    setMessage('확인 중...');

    // 약간의 딜레이 (UX를 위해)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = performStatusCheck(checkType);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);

      // 2초 후 자동으로 계속 진행
      setTimeout(() => {
        onConfirm(result);
      }, 2000);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // 화면 경계 체크
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 80;

    setButtonPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 스타일
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '380px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    zIndex: 2147483646, // StatusUI보다 1 낮게 설정
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isMinimized ? 'translateX(450px)' : 'translateX(0)',
    opacity: isMinimized ? 0 : 1,
  };

  const floatingButtonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: `${buttonPosition.y}px`,
    right: `${buttonPosition.x}px`,
    width: '60px',
    height: '60px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    boxShadow: isDragging
      ? '0 8px 30px rgba(102, 126, 234, 0.6)'
      : '0 4px 20px rgba(102, 126, 234, 0.4)',
    cursor: isDragging ? 'grabbing' : 'grab',
    display: isMinimized ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    color: 'white',
  };

  const contentStyle: React.CSSProperties = {
    padding: '30px 20px',
    textAlign: 'center',
  };

  const statusIconStyle: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: '20px',
    animation:
      status === 'checking'
        ? 'rotate 1s linear infinite'
        : status === 'success'
          ? 'bounce 0.5s ease'
          : status === 'error'
            ? 'shake 0.5s ease'
            : 'none',
  };

  // CSS 애니메이션 추가
  const animationStyles = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;

  const messageStyle: React.CSSProperties = {
    fontSize: '16px',
    marginBottom: '10px',
    fontWeight: '500',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    padding: '0 20px 20px',
  };

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    color: '#666',
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return '🔍';
      case 'checking':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔍';
    }
  };

  return (
    <>
      {/* 애니메이션 스타일 */}
      <style>{animationStyles}</style>

      {/* 메인 UI */}
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>8G Extension</h3>
          <button
            style={closeButtonStyle}
            onClick={handleMinimize}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        <div style={contentStyle}>
          <div style={statusIconStyle}>{getStatusIcon()}</div>
          <div style={messageStyle}>{status === 'idle' ? title : message}</div>
          {description && status === 'idle' && <div style={descriptionStyle}>{description}</div>}
        </div>

        <div style={buttonContainerStyle}>
          {status === 'idle' && (
            <>
              <button
                style={primaryButtonStyle}
                onClick={handleCheck}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                확인
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={onCancel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
              >
                취소
              </button>
            </>
          )}

          {status === 'checking' && (
            <button style={primaryButtonStyle} disabled>
              확인 중...
            </button>
          )}

          {status === 'error' && (
            <>
              <button
                style={primaryButtonStyle}
                onClick={handleCheck}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                다시 시도
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={onCancel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
              >
                취소
              </button>
            </>
          )}

          {status === 'success' && (
            <div style={{ color: '#4CAF50', fontWeight: '600' }}>
              잠시 후 자동으로 진행됩니다...
            </div>
          )}
        </div>
      </div>

      {/* 플로팅 버튼 (최소화 시) */}
      {isMinimized && (
        <div
          style={floatingButtonStyle}
          onClick={handleRestore}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title="클릭: 열기 | 드래그: 이동"
        >
          <span style={{ fontSize: '24px', color: 'white', pointerEvents: 'none' }}>📋</span>
        </div>
      )}
    </>
  );
};

export default CheckStatusUI;
