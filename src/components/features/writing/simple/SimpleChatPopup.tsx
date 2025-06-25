import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Minimize2, Maximize2, X, MessageSquare } from 'lucide-react';
import { useSimplePopups } from './SimplePopupManager';
import { useDragBehavior } from './hooks/useDragBehavior';
import ChatBanner from './components/ChatBanner';

interface SimpleChatPopupProps {
  id: string;
  position: { x: number; y: number };
  projectId: string;
  chapterId?: string;
  selectedText?: string;
  lineNumber?: number;
  isMinimized: boolean;
  initialMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

const SimpleChatPopup = ({
  id,
  position,
  projectId,
  chapterId,
  selectedText,
  lineNumber,
  isMinimized,
  initialMessages = []
}: SimpleChatPopupProps) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bannerState, setBannerState] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { updatePopup, closePopup, sendMessageWithHashVerification } = useSimplePopups();
  
  const handlePositionUpdate = (popupId: string, newPosition: { x: number; y: number }) => {
    updatePopup(popupId, { position: newPosition });
  };
  
  const { dragRef, isDragging, handleMouseDown } = useDragBehavior(id, handlePositionUpdate);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Perform hash verification before sending to AI (only for chat popups)
      if (sendMessageWithHashVerification) {
        const verificationResult = await sendMessageWithHashVerification(
          id,
          userMessage.content,
          projectId,
          chapterId
        );

        // Show banner if provided
        if (verificationResult.bannerState) {
          setBannerState(verificationResult.bannerState);
        }

        if (!verificationResult.shouldProceed) {
          setIsLoading(false);
          return;
        }
      }

      // Simulate AI response (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = {
        role: 'assistant' as const,
        content: `I understand you're asking about: "${userMessage.content}". Let me help you with that based on your story context.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setBannerState({ message: 'Failed to send message', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMinimize = () => {
    updatePopup(id, { isMinimized: !isMinimized });
  };

  const handleClose = () => {
    closePopup(id);
  };

  const dismissBanner = () => {
    setBannerState(null);
  };

  if (isMinimized) {
    return (
      <Card 
        className="fixed bg-white shadow-lg border-2 border-blue-200 cursor-pointer hover:shadow-xl transition-all duration-200 z-[9999]"
        style={{ 
          left: position.x, 
          top: position.y,
          transform: isDragging ? 'rotate(2deg)' : 'none'
        }}
        onClick={handleMinimize}
      >
        <div className="flex items-center p-3 space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">Chat</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="ml-2 h-6 w-6 p-0 hover:bg-red-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="fixed bg-white shadow-xl border-2 border-blue-200 z-[9999]"
      style={{ 
        left: position.x, 
        top: position.y,
        width: '450px',
        height: '550px',
        transform: isDragging ? 'rotate(1deg) scale(1.02)' : 'none'
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div 
          ref={dragRef}
          className="flex items-center justify-between p-4 border-b bg-blue-50 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-800">AI Chat</h3>
            {selectedText && (
              <span className="text-xs text-slate-500 truncate max-w-[200px]">
                "{selectedText}"
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Banner */}
        {bannerState && (
          <div className="px-4 pt-2">
            <ChatBanner
              message={bannerState.message}
              type={bannerState.type}
              onDismiss={dismissBanner}
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Start a conversation with AI about your story</p>
              {selectedText && (
                <p className="text-xs mt-1">Context: "{selectedText}"</p>
              )}
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 opacity-70`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI about your story..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="h-10 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SimpleChatPopup;
