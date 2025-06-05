
import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, MessageSquare, Brain, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ChatType = 'comment' | 'coherence' | 'next-steps' | 'chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SimpleChatPopupProps {
  id: string;
  type: ChatType;
  position: { x: number; y: number };
  selectedText?: string;
  onClose: () => void;
  onMinimize: () => void;
  onMessage: (message: Message) => void;
  isMinimized?: boolean;
  messages: Message[];
}

const getChatTypeInfo = (type: ChatType) => {
  switch (type) {
    case 'comment':
      return { icon: MessageSquare, title: 'Comment', color: 'blue' };
    case 'coherence':
      return { icon: Brain, title: 'AI/Coherence', color: 'purple' };
    case 'next-steps':
      return { icon: ArrowRight, title: 'AI/Next Steps', color: 'green' };
    case 'chat':
      return { icon: MessageCircle, title: 'Chat', color: 'orange' };
    default:
      return { icon: MessageCircle, title: 'Chat', color: 'gray' };
  }
};

const SimpleChatPopup = ({
  id,
  type,
  position,
  selectedText,
  onClose,
  onMinimize,
  onMessage,
  isMinimized = false,
  messages
}: SimpleChatPopupProps) => {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const popupRef = useRef<HTMLDivElement>(null);

  const { icon: Icon, title, color } = getChatTypeInfo(type);

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = popupRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 500));
        setCurrentPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onMessage({
        role: 'user',
        content: input.trim(),
        timestamp: new Date()
      });
      setInput('');
      
      // Simple auto-response for demo
      setTimeout(() => {
        onMessage({
          role: 'assistant',
          content: `Thanks for your ${type}! I'll help you with that.`,
          timestamp: new Date()
        });
      }, 1000);
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed pointer-events-auto z-[500]"
      style={{
        left: currentPosition.x,
        top: currentPosition.y,
        width: isMinimized ? '200px' : '400px',
        height: isMinimized ? 'auto' : '500px'
      }}
    >
      <Card className="h-full shadow-xl border-2 bg-white">
        <CardHeader 
          className={`p-3 bg-${color}-50 border-b drag-handle cursor-move`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 text-${color}-600`} />
              <span className="font-medium text-sm">{title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onMinimize}
                className="h-6 w-6 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {selectedText && !isMinimized && (
            <div className="text-xs text-slate-600 mt-1 p-2 bg-slate-100 rounded">
              "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
            </div>
          )}
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg max-w-[90%] ${
                      message.role === 'user'
                        ? 'bg-blue-100 text-blue-900 ml-auto'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Type your ${type}...`}
                  className="resize-none h-10"
                  rows={1}
                />
                <Button type="submit" size="sm" disabled={!input.trim()}>
                  Send
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SimpleChatPopup;
