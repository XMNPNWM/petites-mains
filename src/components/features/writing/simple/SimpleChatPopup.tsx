import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minus, MessageSquare, MessageCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SimplePopup, useSimplePopups } from './SimplePopupManager';

interface SimpleChatPopupProps {
  popup: SimplePopup;
}

const SimpleChatPopup = ({ popup }: SimpleChatPopupProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { updatePopup, closePopup, deletePopup, goToLine } = useSimplePopups();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [popup.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    updatePopup(popup.id, {
      messages: [...popup.messages, userMessage]
    });

    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual AI integration)
      setTimeout(() => {
        const aiResponse = {
          role: 'assistant' as const,
          content: popup.type === 'comment' 
            ? `Thank you for your comment about "${popup.selectedText}". I've noted this feedback.`
            : `I understand your question. Let me help you with that.`,
          timestamp: new Date()
        };

        updatePopup(popup.id, {
          messages: [...popup.messages, userMessage, aiResponse]
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGoToLine = () => {
    if (popup.chapterId && popup.lineNumber) {
      goToLine(popup.chapterId, popup.lineNumber);
    }
  };

  const handleMinimize = () => {
    updatePopup(popup.id, { isMinimized: !popup.isMinimized });
  };

  const handleClose = () => {
    closePopup(popup.id);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deletePopup(popup.id);
    } else {
      setShowDeleteConfirm(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (popup.isMinimized) {
    return (
      <div
        className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        style={{
          left: popup.position.x,
          top: popup.position.y,
          width: '200px',
          height: '40px'
        }}
        onClick={handleMinimize}
      >
        <div className="flex items-center justify-between p-2 h-full">
          <div className="flex items-center gap-2">
            {popup.type === 'comment' ? (
              <MessageSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <MessageCircle className="w-4 h-4 text-orange-600" />
            )}
            <span className="text-sm font-medium">
              {popup.type === 'comment' ? 'Comment' : 'Chat'}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="h-6 w-6 p-0"
              title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete permanently'}
            >
              <Trash2 className={`w-3 h-3 ${showDeleteConfirm ? 'text-red-600' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: popup.position.x,
        top: popup.position.y,
        width: '400px',
        height: '500px'
      }}
    >
      <Card className="h-full flex flex-col shadow-xl border-slate-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            {popup.type === 'comment' ? (
              <MessageSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <MessageCircle className="w-4 h-4 text-orange-600" />
            )}
            <h3 className="font-semibold text-sm">
              {popup.type === 'comment' ? 'Comment' : 'AI Chat'}
            </h3>
            {popup.lineNumber && (
              <span className="text-xs text-slate-500">Line {popup.lineNumber}</span>
            )}
          </div>
          <div className="flex gap-1">
            {popup.lineNumber && popup.chapterId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToLine}
                className="h-6 w-6 p-0"
                title="Go to line"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-6 w-6 p-0"
              title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete permanently'}
            >
              <Trash2 className={`w-3 h-3 ${showDeleteConfirm ? 'text-red-600' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-6 w-6 p-0"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Delete confirmation message */}
          {showDeleteConfirm && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              Click delete again to permanently remove this {popup.type}
            </div>
          )}

          {/* Show selected text context for comments */}
          {popup.type === 'comment' && popup.selectedText && (
            <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-200 rounded text-sm">
              <div className="text-blue-800 font-medium mb-1">Selected text:</div>
              <div className="text-blue-700 italic">"{popup.selectedText}"</div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {popup.messages.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-8">
                {popup.type === 'comment' 
                  ? 'Add a comment about the selected text...'
                  : 'Start a conversation with AI...'
                }
              </div>
            )}
            
            {popup.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-800 p-2 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={popup.type === 'comment' ? 'Add your comment...' : 'Type your message...'}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleChatPopup;
