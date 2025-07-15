
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useSimplePopups } from './SimplePopupManager';
import { useDragBehavior } from './hooks/useDragBehavior';
import { useChatMessages } from './hooks/useChatMessages';
import ChatBanner from './components/ChatBanner';
import MinimizedChatView from './components/MinimizedChatView';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import ChatInput from './components/ChatInput';

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
  const { updatePopup, closePopup, deletePopup } = useSimplePopups();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handlePositionUpdate = (popupId: string, newPosition: { x: number; y: number }) => {
    updatePopup(popupId, { position: newPosition });
  };
  
  const { dragRef, isDragging, handleMouseDown } = useDragBehavior(id, handlePositionUpdate);

  const {
    messages,
    isLoading,
    bannerState,
    sendMessage,
    dismissBanner
  } = useChatMessages({
    id,
    projectId,
    chapterId,
    initialMessages
  });

  const handleMinimize = () => {
    updatePopup(id, { isMinimized: !isMinimized });
  };

  const handleClose = () => {
    closePopup(id);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deletePopup(id);
    } else {
      setShowDeleteConfirm(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  if (isMinimized) {
    return (
      <MinimizedChatView
        position={position}
        isDragging={isDragging}
        onExpand={handleMinimize}
        onClose={handleClose}
      />
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
        <div ref={dragRef}>
            <ChatHeader
              selectedText={selectedText}
              isMinimized={isMinimized}
              showDeleteConfirm={showDeleteConfirm}
              projectId={projectId}
              onMouseDown={handleMouseDown}
              onMinimize={handleMinimize}
              onClose={handleClose}
              onDelete={handleDelete}
            />
        </div>

        {bannerState && (
          <div className="px-4 pt-2">
            <ChatBanner
              message={bannerState.message}
              type={bannerState.type}
              onDismiss={dismissBanner}
            />
          </div>
        )}

        <ChatMessages 
          messages={messages} 
          selectedText={selectedText} 
        />

        <ChatInput 
          onSendMessage={sendMessage}
          disabled={isLoading}
        />
      </div>
    </Card>
  );
};

export default SimpleChatPopup;
