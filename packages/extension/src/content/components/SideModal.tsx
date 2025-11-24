import React, { useState, useEffect, useRef } from 'react';
import { getTranslation, getCurrentLocale } from '../../locales';
import { WorkspaceItemDto } from '@/sdk';

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

interface WorkspaceCardProps {
  workspace: WorkspaceItemDto;
  isLast: boolean;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace: ws, isLast }) => {
  const isNotAdmin = ws.isAdmin === false;
  
  return (
    <div style={{
      background: 'white',
      padding: '0.7rem 1rem',
      borderRadius: '0.5rem',
      border: isNotAdmin ? '1px solid #f87171' : '1px solid #10b981',
      marginBottom: isLast ? '0' : '0.5rem',
      opacity: isNotAdmin ? 0.4 : 1,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      cursor: 'default',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.375rem',
          flexShrink: 0,
          overflow: 'hidden',
          background: ws.image ? 'transparent' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e5e7eb',
        }}>
          {ws.image ? (
            <img 
              src={ws.image} 
              alt="workspace" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                const parent = e.currentTarget.parentElement!;
                parent.style.background = '#f3f4f6';
                parent.innerHTML = `
                  <div style="
                    font-size: 14px;
                    color: #6b7280;
                    font-weight: 600;
                  ">
                    ${ws.name.charAt(0).toUpperCase()}
                  </div>
                `;
              }}
            />
          ) : (
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '600',
            }}>
              {ws.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '16px',
            color: '#1f2937',
            fontWeight: '600',
            margin: '0px 0px 2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}>
            {ws.name}
          </p>
          {ws.slug && (
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              @{ws.slug}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          {ws.isAdmin === true && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: '#dcfce7',
              padding: '0.1875rem 0.5rem',
              borderRadius: '0.25rem',
            }}>
              <div style={{
                width: '0.875rem',
                height: '0.875rem',
                background: '#059669',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: 'white',
              }}>
                ✓
              </div>
              <span style={{
                fontSize: '11px',
                color: '#059669',
                fontWeight: '500',
              }}>
                Admin
              </span>
            </div>
          )}
          {isNotAdmin && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: '#fee2e2',
              padding: '0.1875rem 0.5rem',
              borderRadius: '0.25rem',
            }}>
              <div style={{
                width: '0.875rem',
                height: '0.875rem',
                background: '#dc2626',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
              }}>
                ⚠
              </div>
              <span style={{
                fontSize: '11px',
                color: '#dc2626',
                fontWeight: '500',
              }}>
                No Access
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SideModal: React.FC<SideModalProps> = ({ 
  defaultOpen = false, 
  onToggle,
  serviceName,
  workspaces = []
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // defaultOpen prop이 변경되면 내부 상태도 동기화
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);
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
    
    // 모달을 열 때 background에서 최신 워크스페이스 데이터 요청
    if (newState) {
      // background에게 현재 탭의 저장된 데이터를 요청
      chrome.runtime.sendMessage({ 
        type: 'GET_SIDE_MODAL_DATA' 
      }).then((response) => {
        if (response?.workspaces) {
          // 워크스페이스 업데이트 이벤트 발생
          window.dispatchEvent(
            new CustomEvent('8g-update-side-modal-workspaces', {
              detail: { workspaces: response.workspaces },
            })
          );
        }
      }).catch(error => {
        console.warn('Failed to get side modal data:', error);
      });
    }
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
    width: 'min(90vw, 400px)',
    maxHeight: '100vh',
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
            height: '100%',
          }}>
            {/* 메인 콘텐츠 */}
            <div style={{
              flex: 1,
              padding: '1.5rem',
              fontSize: '15px',
              lineHeight: 1.5,
              color: '#1d1c1d',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0, // flex 아이템이 축소 가능하도록
            }}>
              <div style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.3s ease',
                transitionDelay: isOpen ? '0.2s' : '0s',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}>
              
              {/* 서비스 제목 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.75rem',
                marginBottom: '1rem'
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
                    fontSize: '19px',
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
                    fontSize: '15px',
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
                marginBottom: '1rem',
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
                  fontSize: '15px',
                  color: '#065f46',
                  fontWeight: '500',
                }}>
                  {t('ui.side_modal.already_logged_in')}
                </span>
              </div>

              {/* 워크스페이스 목록 */}
              <div style={{ 
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto', // 필요시 스크롤 허용
                // maxHeight: '40vh', // 화면 높이의 40%로 조금 증가
                // minHeight: '220px', // 최소 높이도 조금 증가
              }}>
                {(() => {
                  const adminWorkspaces = displayWorkspaces.filter(ws => ws.isAdmin === true);
                  const nonAdminWorkspaces = displayWorkspaces.filter(ws => ws.isAdmin === false);
                  
                  return (
                    <>
                      {/* Available Workspaces 블록 */}
                      {adminWorkspaces.length > 0 && (
                        <div style={{ 
                          flex: nonAdminWorkspaces.length > 0 ? 1 : 'none', // 두 블록이 있으면 균등 분할
                          marginBottom: nonAdminWorkspaces.length > 0 ? '1rem' : '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          // minHeight: nonAdminWorkspaces.length > 0 ? '80px' : 'auto', // 최소 높이 줄임
                          // maxHeight: nonAdminWorkspaces.length > 0 ? '45%' : 'none', // 최대 높이 제한
                        }}>
                          <p style={{
                            fontSize: '15px',
                            color: '#059669',
                            margin: 0,
                            fontWeight: '600',
                            flexShrink: 0,
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'white',
                            paddingBottom: '0.75rem',
                            zIndex: 1,
                          }}>
                            Available Workspaces ({adminWorkspaces.length})
                          </p>
                          <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            border: '1px solid #d1fae5',
                            borderRadius: '0.375rem',
                            background: '#f0fdf4',
                            padding: '0.5rem',
                          }}>
                            {adminWorkspaces.map((ws: WorkspaceItemDto, index: number) => (
                              <WorkspaceCard key={ws.id || `admin-${index}`} workspace={ws} isLast={index === adminWorkspaces.length - 1} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* No Access Workspaces 블록 */}
                      {nonAdminWorkspaces.length > 0 && (
                        <div style={{ 
                          flex: adminWorkspaces.length > 0 ? 1 : 'none', // 두 블록이 있으면 균등 분할
                          marginBottom: '0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          // minHeight: adminWorkspaces.length > 0 ? '80px' : 'auto', // 최소 높이 줄임
                          // maxHeight: adminWorkspaces.length > 0 ? '45%' : 'none', // 최대 높이 제한
                        }}>
                          <p style={{
                            fontSize: '15px',
                            color: '#dc2626',
                            margin: 0,
                            fontWeight: '600',
                            flexShrink: 0,
                            position: 'sticky',
                            top: 0,
                            backgroundColor: 'white',
                            paddingBottom: '0.75rem',
                            zIndex: 1,
                          }}>
                            No Access Workspaces ({nonAdminWorkspaces.length})
                          </p>
                          <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            border: '1px solid #fecaca',
                            borderRadius: '0.375rem',
                            background: '#fef2f2',
                            padding: '0.5rem',
                          }}>
                            {nonAdminWorkspaces.map((ws: WorkspaceItemDto, index: number) => (
                              <WorkspaceCard key={ws.id || `noaccess-${index}`} workspace={ws} isLast={index === nonAdminWorkspaces.length - 1} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 단일 워크스페이스인 경우 */}
                      {displayWorkspaces.length === 1 && (
                        <div>
                          <p style={{
                            fontSize: '15px',
                            color: '#6b7280',
                            margin: '0 0 12px 0',
                            fontWeight: '500',
                          }}>
                            {t('ui.side_modal.current_workspace')}
                          </p>
                          <WorkspaceCard workspace={displayWorkspaces[0]} isLast={true} />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* 설명 텍스트 */}
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: 1.5,
                  margin: '0 0 10px 0',
                }}>
                  {t('ui.side_modal.admin_permission_required')}
                </p>
                <p style={{
                  fontSize: '15px',
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
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '15px',
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
              padding: '1.5rem',
              borderTop: '1px solid #f3f4f6',
              background: 'white',
              flexShrink: 0,
              minHeight: 'fit-content', // 내용에 맞는 최소 높이
            }}>
              {/* 하단 텍스트 */}
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                margin: '0 0 1rem 0',
                lineHeight: 1.4,
                wordWrap: 'break-word',
                overflow: 'hidden',
              }}>
                {t('ui.side_modal.continue_instruction')}
              </p>

              {/* 인증 버튼 */}
              <button style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '15px',
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

interface SideModalState {
  isOpen: boolean;
  workspaces: WorkspaceItemDto[];
  siteName?: string;
  favicon?: string;
  isLoggedIn: boolean;
}

export const SideModalContainer: React.FC = () => {
  console.log('[8G SideModal] Rendering SideModalContainer');
  
  const [state, setState] = useState<SideModalState>({
    isOpen: false,
    workspaces: [],
    isLoggedIn: true,
  });

  useEffect(() => {
    const handleShow = (event: CustomEvent) => {
      if (event.detail?.workspaces) {
        setState(prev => ({ ...prev, isOpen: true, workspaces: event.detail.workspaces }));
      } else {
        setState(prev => ({ ...prev, isOpen: true }));
      }
    };
    const handleHide = () => setState(prev => ({ ...prev, isOpen: false }));
    
    const handleUpdateWorkspaces = (event: CustomEvent) => {
      if (event.detail?.workspaces) { 
        setState(prev => ({ ...prev, workspaces: event.detail.workspaces }));
      }
    };

    const handleUpdateSiteInfo = (event: CustomEvent) => {
      const { siteName, favicon } = event.detail || {};
      setState(prev => ({ ...prev, siteName, favicon }));
    };

    const handleUpdateLoginStatus = (event: CustomEvent) => {
      const { isLoggedIn } = event.detail || {};
      setState(prev => ({ ...prev, isLoggedIn: isLoggedIn !== undefined ? isLoggedIn : prev.isLoggedIn }));
    };

    const handleGetStatus = (event: CustomEvent) => {
      // Background에서 상태 요청 시 응답
      if (event.detail?.callback) {
        event.detail.callback({ isOpen: state.isOpen });
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('8g-show-side-modal', handleShow as EventListener);
    window.addEventListener('8g-hide-side-modal', handleHide);
    window.addEventListener('8g-update-side-modal-workspaces', handleUpdateWorkspaces as EventListener);
    window.addEventListener('8g-update-side-modal-site-info', handleUpdateSiteInfo as EventListener);
    window.addEventListener('8g-update-side-modal-login-status', handleUpdateLoginStatus as EventListener);
    window.addEventListener('8g-get-side-modal-status', handleGetStatus as EventListener);

    // 초기 더미 데이터 설정
    const dummyWorkspaces: WorkspaceItemDto[] = [
      // Available Workspaces (Admin = true) - 20개
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `admin-ws-${i + 1}`,
        slug: `admin-workspace-${i + 1}`,
        name: `Admin Workspace ${i + 1}`,
        image: i % 3 === 0 ? "https://avatars.slack-edge.com/2023-09-18/5909002618259_7d2d9705b28fbbc4a832_88.png" : "",
        memberCount: Math.floor(Math.random() * 50) + 5,
        isAdmin: true
      })),
      // No Access Workspaces (Admin = false) - 20개
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `noaccess-ws-${i + 1}`,
        slug: `noaccess-workspace-${i + 1}`,
        name: `No Access Workspace ${i + 1}`,
        image: i % 4 === 0 ? "https://avatars.slack-edge.com/2023-09-18/5909002618259_7d2d9705b28fbbc4a832_88.png" : "",
        memberCount: Math.floor(Math.random() * 100) + 10,
        isAdmin: false
      }))
    ];
    
    setState(prev => ({ ...prev, workspaces: dummyWorkspaces }));

    return () => {
      window.removeEventListener('8g-show-side-modal', handleShow as EventListener);
      window.removeEventListener('8g-hide-side-modal', handleHide);
      window.removeEventListener('8g-update-side-modal-workspaces', handleUpdateWorkspaces as EventListener);
      window.removeEventListener('8g-update-side-modal-site-info', handleUpdateSiteInfo as EventListener);
      window.removeEventListener('8g-update-side-modal-login-status', handleUpdateLoginStatus as EventListener);
      window.removeEventListener('8g-get-side-modal-status', handleGetStatus as EventListener);
    };
  }, [state.isOpen]); // state.isOpen을 의존성에 추가해서 상태 응답이 최신 값을 반영하도록

  return (
    <SideModal 
      defaultOpen={state.isOpen} 
      workspaces={state.workspaces}
      serviceName={state.siteName}
      onToggle={(isOpen) => setState(prev => ({ ...prev, isOpen }))}
    />
  );
};

export default SideModal;