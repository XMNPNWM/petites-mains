
import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, MessageSquare, Brain, ArrowRight, MessageCircle, Send } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SelectedTextContext } from '@/types/comments';
import { usePopupChats } from './PopupChatManager';

export type ChatType = 'comment' | 'coherence' | 'next-steps' | 'chat';

interface PopupChatProps {
  id: string;
  type: ChatType;
  initialPosition: { x: number; y: number };
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  projectId: string;
  chapterId?: string;
  selectedText?: SelectedTextContext;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
}

const getChatIcon = (type: ChatType) => {
  switch (type) {
    case 'comment': return <MessageSquare className="w-4 h-4 text-blue-600" />;
    case 'coherence': return <Brain className="w-4 h-4 text-purple-600" />;
    case 'next-steps': return <ArrowRight className="w-4 h-4 text-green-600" />;
    case 'chat': return <MessageCircle className="w-4 h-4 text-orange-600" />;
  }
};

const getChatTitle = (type: ChatType) => {
  switch (type) {
    case 'comment': return 'Comment';
    case 'coherence': return 'AI Coherence Check';
    case 'next-steps': return 'AI Next Steps';
    case 'chat': return 'Chat Assistant';
  }
};

const PopupChat = ({
  id,
  type,
  initialPosition,
  onClose,
  onMinimize,
  isMinimized,
  projectId,
  chapterId,
  selectedText,
  initialMessages = []
}: PopupChatProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  const { saveChatMessage } = usePopupChats();

  // Initialize messages from props
  useEffect(() => {
    console.log('PopupChat initialized:', { id, type, initialMessages: initialMessages.length });
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, id, type]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    
    document.body.style.userSelect = 'none';
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height
    };
    
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, dragRef.current.startPosX + deltaX)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, dragRef.current.startPosY + deltaY))
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        
        setSize({
          width: Math.max(300, resizeRef.current.startWidth + deltaX),
          height: Math.max(200, resizeRef.current.startHeight + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.body.style.userSelect = '';
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, size]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    setIsSaving(true);
    
    const userMessage = {
      role: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(id, userMessage);
    
    setCurrentMessage('');
    
    // Simulate AI response for non-comment types
    if (type !== 'comment') {
      setTimeout(async () => {
        const aiResponse = {
          role: 'assistant' as const,
          content: `I understand you're asking about: "${currentMessage}". This is a placeholder response for ${getChatTitle(type)}.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        await saveChatMessage(id, aiResponse);
      }, 1000);
    }
    
    setIsSaving(false);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Closing popup chat:', id);
    onClose();
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Minimizing popup chat:', id);
    onMinimize();
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex items-center gap-2 cursor-pointer z-[9999]"
        style={{ left: position.x, top: position.y }}
        onClick={handleMinimize}
      >
        {getChatIcon(type)}
        <span className="text-sm font-medium">
          {getChatTitle(type)}
          {selectedText && type === 'comment' && (
            <span className="text-xs text-slate-500 ml-1">
              ("{selectedText.text}")
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <Card
      className="fixed shadow-xl border border-slate-200 z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
    >
      <CardHeader
        className="flex flex-row items-center justify-between p-3 cursor-move bg-slate-50 border-b"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          {getChatIcon(type)}
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">{getChatTitle(type)}</h3>
            {selectedText && type === 'comment' && (
              <span className="text-xs text-slate-500 truncate max-w-48">
                on "{selectedText.text}"
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleMinimize} className="h-6 w-6 p-0">
            <Minus className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClose} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-full">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-8">
              {type === 'comment' && selectedText 
                ? `Write a comment about "${selectedText.text}"`
                : `Start a conversation about your ${type === 'comment' ? 'chapter content' : 'story'}.`
              }
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Input Area */}
        <div className="border-t p-3 flex gap-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={
              type === 'comment' && selectedText 
                ? `Comment on "${selectedText.text}"...`
                : `Ask about ${getChatTitle(type).toLowerCase()}...`
            }
            className="flex-1 min-h-0 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isSaving}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Resize Handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-400 rotate-45"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopupChat;
