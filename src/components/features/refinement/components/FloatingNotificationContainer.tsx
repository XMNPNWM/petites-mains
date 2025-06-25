
import React, { useState, useCallback } from 'react';
import FloatingNotification from './FloatingNotification';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  autoDissmiss?: boolean;
  duration?: number;
}

interface FloatingNotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const FloatingNotificationContainer = ({ notifications, onDismiss }: FloatingNotificationContainerProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          style={{ 
            transform: `translateY(-${index * 4}px)`,
            zIndex: 9999 - index
          }}
        >
          <FloatingNotification
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onDismiss={onDismiss}
            autoDissmiss={notification.autoDissmiss}
            duration={notification.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingNotificationContainer;
