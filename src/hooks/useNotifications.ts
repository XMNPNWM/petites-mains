
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  autoDissmiss?: boolean;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'loading',
    options?: { autoDissmiss?: boolean; duration?: number }
  ) => {
    const id = uuidv4();
    const notification: Notification = {
      id,
      message,
      type,
      autoDissmiss: options?.autoDissmiss ?? true,
      duration: options?.duration ?? 4000
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Omit<Notification, 'id'>>) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    updateNotification,
    clearNotifications
  };
};
