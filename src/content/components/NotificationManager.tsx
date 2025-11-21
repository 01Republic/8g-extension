import React, { useState, useEffect } from 'react';
import FloatingNotificationButton, { NotificationUrgency } from './FloatingNotificationButton';

export interface NotificationData {
  id: string;
  message: string;
  urgency: NotificationUrgency;
  checkType: string;
  title: string;
  description?: string;
  options?: any;
  autoClick?: boolean;
}

interface NotificationManagerProps {}

const NotificationManager: React.FC<NotificationManagerProps> = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    // 알림 표시 이벤트 리스너
    const handleShowNotification = (event: CustomEvent<NotificationData>) => {
      const notification = event.detail;
      setNotifications((prev) => {
        // 중복 방지
        const exists = prev.find((n) => n.id === notification.id);
        if (exists) return prev;
        return [...prev, notification];
      });

      // 첫 번째 알림이면 활성화
      if (notifications.length === 0) {
        setActiveNotification(notification);
      }
    };

    // 알림 숨기기 이벤트 리스너
    const handleHideNotification = (event: CustomEvent<{ id?: string }>) => {
      const { id } = event.detail;
      if (id) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (activeNotification?.id === id) {
          setActiveNotification(null);
        }
      } else {
        // 모든 알림 제거
        setNotifications([]);
        setActiveNotification(null);
      }
    };

    // 알림 업데이트 이벤트 리스너
    const handleUpdateNotification = (event: CustomEvent<{ id: string; badge?: number }>) => {
      const { id, badge } = event.detail;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, badge } : n)));
    };

    window.addEventListener('8g-show-notification', handleShowNotification as EventListener);
    window.addEventListener('8g-hide-notification', handleHideNotification as EventListener);
    window.addEventListener('8g-update-notification', handleUpdateNotification as EventListener);

    return () => {
      window.removeEventListener('8g-show-notification', handleShowNotification as EventListener);
      window.removeEventListener('8g-hide-notification', handleHideNotification as EventListener);
      window.removeEventListener(
        '8g-update-notification',
        handleUpdateNotification as EventListener
      );
    };
  }, [notifications, activeNotification]);

  // 알림 클릭 핸들러 - 사용자 제스처로 Side Panel 열기
  const handleNotificationClick = (notification: NotificationData) => {
    console.log('[NotificationManager] User clicked notification:', notification);

    // Background로 메시지 전송 (사용자 제스처 컨텍스트 유지)
    chrome.runtime.sendMessage(
      {
        type: 'OPEN_SIDE_PANEL_FROM_NOTIFICATION',
        payload: {
          notificationId: notification.id,
          checkType: notification.checkType,
          title: notification.title,
          description: notification.description,
          options: notification.options,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            '[NotificationManager] Failed to open side panel:',
            chrome.runtime.lastError
          );

          // 폴백: Side Panel 열기 실패 시 인라인 UI 표시
          window.dispatchEvent(
            new CustomEvent('8g-show-check-status-fallback', {
              detail: notification,
            })
          );
        } else if (response?.success) {
          console.log('[NotificationManager] Side panel opened successfully');

          // 성공하면 해당 알림 제거
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

          // 다음 알림 활성화
          if (notifications.length > 1) {
            const nextNotification = notifications.find((n) => n.id !== notification.id);
            if (nextNotification) {
              setActiveNotification(nextNotification);
            }
          } else {
            setActiveNotification(null);
          }
        }
      }
    );
  };

  // 알림 무시 핸들러
  const handleNotificationDismiss = (notificationId: string) => {
    console.log('[NotificationManager] User dismissed notification:', notificationId);

    // Background로 알림 무시 메시지 전송
    chrome.runtime.sendMessage({
      type: 'NOTIFICATION_DISMISSED',
      payload: { notificationId },
    });

    // UI에서 제거
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    // 다음 알림 활성화
    if (activeNotification?.id === notificationId) {
      const nextNotification = notifications.find((n) => n.id !== notificationId);
      setActiveNotification(nextNotification || null);
    }
  };

  // 현재 활성 알림만 표시 (나머지는 큐에 대기)
  if (!activeNotification) return null;

  const totalCount = notifications.length;
  const currentIndex = notifications.findIndex((n) => n.id === activeNotification.id) + 1;
  const badge = totalCount > 1 ? totalCount : 0;

  return (
    <FloatingNotificationButton
      id={activeNotification.id}
      message={`${activeNotification.message}${totalCount > 1 ? ` (${currentIndex}/${totalCount})` : ''}`}
      badge={badge}
      urgency={activeNotification.urgency}
      onClick={() => handleNotificationClick(activeNotification)}
      onDismiss={() => handleNotificationDismiss(activeNotification.id)}
      fixedPosition={activeNotification.autoClick}
      disableDrag={activeNotification.autoClick}
      autoClickTarget={activeNotification.autoClick}
    />
  );
};

export default NotificationManager;
