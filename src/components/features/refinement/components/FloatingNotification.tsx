
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, Loader2, X } from 'lucide-react';

interface FloatingNotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  onDismiss: (id: string) => void;
  autoDissmiss?: boolean;
  duration?: number;
}

const FloatingNotification = ({ 
  id,
  message, 
  type, 
  onDismiss, 
  autoDissmiss = true, 
  duration = 4000 
}: FloatingNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDissmiss && type !== 'loading') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDissmiss, type, duration, onDismiss, id]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 shadow-green-100';
      case 'error':
        return 'bg-red-50 border-red-200 shadow-red-100';
      case 'info':
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
      case 'loading':
        return 'bg-purple-50 border-purple-200 shadow-purple-100';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      case 'loading':
        return 'text-purple-800';
    }
  };

  return (
    <div className={`
      flex items-center justify-between p-4 border rounded-lg shadow-lg
      ${getBgColor()} ${getTextColor()}
      transition-all duration-300 ease-in-out
      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      min-w-[300px] max-w-[400px]
    `}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {type !== 'loading' && (
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(id), 300);
          }}
          className="ml-3 hover:opacity-70 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FloatingNotification;
