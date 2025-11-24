import React, { useState, useEffect, useRef } from 'react';
import { getTranslation, getCurrentLocale } from '../../locales';
import type { WorkspaceItemDto } from '../../sdk/EightGClient';

export interface SideModalProps {
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  serviceName?: string;
  workspaces?: WorkspaceItemDto[];
}

interface SiteInfo {
  favicon: string;
  siteName: string;
}

const SideModal: React.FC<SideModalProps> = ({ 
  defaultOpen = false, 
  onToggle,
  serviceName,
  workspaces = []
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({ favicon: '', siteName: serviceName || '' });
  const modalRef = useRef<HTMLDivElement>(null);

  // workspaces 배열이 비어있으면 기본 더미 데이터 사용
  const displayWorkspaces = workspaces.length > 0 ? workspaces : [{
    id: 'default-ws',
    slug: 'default-workspace',
    name: 'Default Workspace',
    image: '',
    memberCount: 1,
    isAdmin: null
  }];

  // 현재 사이트 정보 가져오기
  useEffect(() => {
    const getCurrentSiteInfo = () => {
      // 파비콘 가져오기
      const faviconLink = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
      let favicon = '/favicon.ico'; // 기본값
      
      if (faviconLink && faviconLink.href) {
        favicon = faviconLink.href;
      } else {
        // 기본 파비콘 경로 시도
        favicon = `${window.location.origin}/favicon.ico`;
      }

      // 사이트 이름 가져오기 (og:site_name 우선, 없으면 title)
      const ogSiteName = document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
      const title = document.title;
      
      let siteName = serviceName || '';
      if (ogSiteName && ogSiteName.content) {
        siteName = ogSiteName.content;
      } else if (title) {
        siteName = title.split(' | ')[0].split(' - ')[0]; // 파이프나 하이픈으로 구분된 첫 부분만
      } else {
        siteName = window.location.hostname;
      }

      setSiteInfo({ favicon, siteName });
    };

    getCurrentSiteInfo();
  }, [serviceName]);

  // content script용 번역 함수
  const t = (key: string, replacements?: Record<string, string | number>) => {
    try {
      return getTranslation(key, getCurrentLocale(), replacements);
    } catch (error) {
      console.warn('Translation failed:', key, error);
      return key; // 실패시 키를 그대로 반환
    }
  };

  const toggleModal = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const closeModal = () => {
    setIsOpen(false);
    onToggle?.(false);
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 외부 메시지로 토글
  useEffect(() => {
    const handleToggleMessage = (event: CustomEvent) => {
      if (event.detail?.action === 'toggle') {
        toggleModal();
      } else if (event.detail?.action === 'close') {
        closeModal();
      }
    };

    window.addEventListener('8g-side-modal-toggle', handleToggleMessage as EventListener);
    return () => window.removeEventListener('8g-side-modal-toggle', handleToggleMessage as EventListener);
  }, []);

  // 백드롭 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // 스타일 정의
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 2147483647,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(2px)',
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '350px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '-2px 0 30px rgba(0, 0, 0, 0.15)',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };


  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    transition: 'all 0.2s ease',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#334155',
  };

  const triggerButtonStyle: React.CSSProperties = {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    transform: `${isOpen ? 'scale(0.9) rotate(45deg)' : 'scale(1)'}`,
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: isOpen 
      ? 'linear-gradient(135deg, #ec4899, #be185d)'
      : 'linear-gradient(135deg, #667eea, #764ba2)',
    border: 'none',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
    cursor: 'pointer',
    zIndex: 2147483646,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const triggerButtonHoverStyle = {
    transform: `scale(${isOpen ? '0.95' : '1.1'})`,
    boxShadow: '0 8px 30px rgba(102, 126, 234, 0.6)',
  };

  // 컨텐츠 아이템 스타일
  const contentItemStyle: React.CSSProperties = {
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.3s ease',
    transitionDelay: isOpen ? '0.2s' : '0s',
  };

  const [isHovering, setIsHovering] = useState(false);

  return (
    <>
      {/* 플로팅 트리거 버튼 */}
      <button
        style={{
          ...triggerButtonStyle,
          ...(isHovering ? triggerButtonHoverStyle : {}),
        }}
        onClick={toggleModal}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        title={isOpen ? t('ui.side_modal.close_panel') : t('ui.side_modal.open_panel')}
      >
        {isOpen ? '×' : 'S'}
      </button>

      {/* 사이드 모달 */}
      <div ref={modalRef} style={backdropStyle} onClick={handleBackdropClick}>
        <div style={panelStyle}>

          {/* 콘텐츠 */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
          }}>
            {/* 메인 콘텐츠 */}
            <div style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: 1.5,
              color: '#1d1c1d',
            }}>
              <div style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.3s ease',
                transitionDelay: isOpen ? '0.2s' : '0s',
              }}>
              
              {/* 서비스 제목 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#6b7280',
                  marginTop: '2px',
                  overflow: 'hidden',
                }}>
                  {siteInfo.favicon ? (
                    <img 
                      src={siteInfo.favicon} 
                      alt="favicon" 
                      style={{
                        width: '24px',
                        height: '24px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '💬';
                      }}
                    />
                  ) : '💬'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0',
                    color: '#1f2937',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {siteInfo.siteName}
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '4px 0 0 0',
                  }}>
                    {t('ui.side_modal.service_in_progress')}
                  </p>
                </div>
                <button 
                  onClick={closeModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    marginTop: '2px',
                    flexShrink: 0,
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  ×
                </button>
              </div>

              {/* 녹색 상태 인디케이터 */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  ✓
                </div>
                <span style={{
                  fontSize: '14px',
                  color: '#065f46',
                  fontWeight: '500',
                }}>
                  {t('ui.side_modal.already_logged_in')}
                </span>
              </div>

              {/* 워크스페이스 목록 */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '0 0 12px 0',
                }}>
                  {displayWorkspaces.length === 1 
                    ? t('ui.side_modal.current_workspace')
                    : `Available Workspaces (${displayWorkspaces.length})`
                  }
                </p>
                
                {displayWorkspaces.map((ws: WorkspaceItemDto, index: number) => (
                  <div key={ws.id || index} style={{
                    background: '#f9fafb',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    marginBottom: index < displayWorkspaces.length - 1 ? '8px' : '0',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {ws.image && (
                        <img 
                          src={ws.image} 
                          alt="workspace" 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px',
                          color: '#1f2937',
                          fontWeight: '600',
                          margin: '0 0 2px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {ws.name}
                        </p>
                        {ws.slug && (
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            @{ws.slug}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {ws.memberCount !== undefined && ws.memberCount > 0 && (
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            {ws.memberCount}
                          </span>
                        )}
                        {ws.isAdmin && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#dcfce7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            <div style={{
                              width: '10px',
                              height: '10px',
                              background: '#059669',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '7px',
                              color: 'white',
                            }}>
                              ✓
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: '#059669',
                              fontWeight: '500',
                            }}>
                              Admin
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 설명 텍스트 */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{
                  fontSize: '14px',
                  color: '#4b5563',
                  lineHeight: 1.5,
                  margin: '0 0 10px 0',
                }}>
                  {t('ui.side_modal.admin_permission_required')}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#4b5563',
                  lineHeight: 1.5,
                  margin: '0',
                }}>
                  {t('ui.side_modal.change_account_instruction', { serviceName: siteInfo.siteName || 'Service' })}
                </p>
              </div>

              {/* 새로고침 버튼 */}
              <button style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                marginBottom: '0',
                transition: 'all 0.2s ease',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: '1.3',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              >
                <span style={{ fontSize: '16px', flexShrink: 0 }}>🔄</span>
                <span style={{ wordWrap: 'break-word' }}>
                  {t('ui.side_modal.refresh_login_status')}
                </span>
              </button>
              
              </div>
            </div>

            {/* 푸터 - 인증 버튼 영역 */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #f3f4f6',
              background: 'white',
              flexShrink: 0,
            }}>
              {/* 하단 텍스트 */}
              <p style={{
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center',
                margin: '0 0 14px 0',
                lineHeight: 1.4,
                wordWrap: 'break-word',
                overflow: 'hidden',
              }}>
                {t('ui.side_modal.continue_instruction')}
              </p>

              {/* 인증 버튼 */}
              <button style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                lineHeight: '1.3',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
              >
                {t('ui.side_modal.authenticate')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const SideModalContainer: React.FC = () => {
  console.log('[8G SideModal] Rendering SideModalContainer');
  
  // 더미 데이터 (테스트용)
  const dummyWorkspaces: WorkspaceItemDto[] = [
    {
      id: "ws-1",
      slug: "slack-workspace",
      name: "Slack Workspace",
      image: "https://avatars.slack-edge.com/2023-09-18/5909002618259_7d2d9705b28fbbc4a832_88.png",
      memberCount: 25,
      isAdmin: true
    },
    {
      id: "ws-2",
      slug: "dev-team",
      name: "Development Team",
      image: "",
      memberCount: 12,
      isAdmin: false
    }
  ];
  
  return <SideModal workspaces={dummyWorkspaces} />;
};

export default SideModal;