
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface ChatBannerProps {
  message: string;
  type: 'success' | 'error' | 'loading';
  onDismiss?: () => void;
  autoDissmiss?: boolean;
  duration?: number;
}

const ChatBanner = ({ 
  message, 
  type, 
  onDismiss, 
  autoDissmiss = true, 
  duration = 3000 
}: ChatBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDissmiss && type !== 'loading') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDissmiss, type, duration, onDismiss]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'loading':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'loading':
        return 'text-blue-800';
    }
  };

  return (
    <div className={`
      flex items-center justify-between px-3 py-2 border rounded-md text-sm
      ${getBgColor()} ${getTextColor()}
      transition-all duration-300 ease-in-out
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
    `}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span>{message}</span>
      </div>
      {type !== 'loading' && (
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="ml-2 hover:opacity-70"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default ChatBanner;
