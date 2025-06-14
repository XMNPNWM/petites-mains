
import React from 'react';
import { createPortal } from 'react-dom';
import SimpleCommentBox from './SimpleCommentBox';
import { useSimplePopups } from './SimplePopupManager';
import { useChatDatabase } from '@/hooks/useChatDatabase';

const SimplePopupRenderer = () => {
  const { livePopups, updatePopup, closePopup } = useSimplePopups();
  const { saveChat } = useChatDatabase();

  const handleUpdate = async (id: string, messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[]) => {
    const popup = livePopups.find(p => p.id === id);
    if (!popup) return;

    // Update popup in memory
    updatePopup(id, { messages });

    // Save to database
    const chatSession = {
      id: popup.id,
      type: popup.type,
      position: popup.position,
      isMinimized: popup.isMinimized,
      createdAt: popup.createdAt,
      projectId: popup.projectId,
      chapterId: popup.chapterId,
      selectedText: popup.selectedText ? {
        text: popup.selectedText,
        startOffset: popup.textPosition || 0,
        endOffset: (popup.textPosition || 0) + popup.selectedText.length,
        lineNumber: popup.lineNumber
      } : undefined,
      lineNumber: popup.lineNumber,
      messages,
      status: 'active' as const
    };

    try {
      await saveChat(chatSession);
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  };

  const handleClose = async (id: string) => {
    closePopup(id);
  };

  // Only render active popups
  const activePopups = livePopups.filter(popup => popup.status === 'open');

  return (
    <>
      {activePopups.map(popup => 
        createPortal(
          <div
            key={popup.id}
            className="fixed z-[9999]"
            style={{
              left: popup.position.x,
              top: popup.position.y,
              transform: popup.isMinimized ? 'scale(0.8)' : 'scale(1)',
              opacity: popup.isMinimized ? 0.7 : 1,
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <SimpleCommentBox
              popup={{
                id: popup.id,
                type: popup.type,
                projectId: popup.projectId,
                chapterId: popup.chapterId || '',
                textPosition: popup.textPosition,
                selectedText: popup.selectedText,
                lineNumber: popup.lineNumber,
                position: popup.position,
                messages: popup.messages,
                status: popup.status,
                isMinimized: popup.isMinimized
              }}
              onUpdate={handleUpdate}
              onClose={handleClose}
            />
          </div>,
          document.body
        )
      )}
    </>
  );
};

export default SimplePopupRenderer;
