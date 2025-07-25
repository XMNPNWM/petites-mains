
import React from 'react';
import { createPortal } from 'react-dom';
import SimpleChatPopup from './SimpleChatPopup';
import SimpleCommentBox from './SimpleCommentBox';
import { useSimplePopups } from './SimplePopupManager';
import { useChatDatabase } from '@/hooks/useChatDatabase';

const SimplePopupRenderer = () => {
  const { popups, updatePopup, closePopup } = useSimplePopups();
  const { saveChat } = useChatDatabase();

  const handleUpdate = async (id: string, messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[]) => {
    const popup = popups.find(p => p.id === id);
    if (!popup) return;

    updatePopup(id, { messages });

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

  const activePopups = popups.filter(popup => popup.status === 'open');

  return (
    <>
      {activePopups.map(popup => 
        createPortal(
          popup.type === 'comment' ? (
            <SimpleCommentBox
              key={popup.id}
              popup={{
                id: popup.id,
                type: popup.type,
                projectId: popup.projectId,
                chapterId: popup.chapterId,
                textPosition: popup.textPosition || null,
                selectedText: popup.selectedText || null,
                lineNumber: popup.lineNumber || null,
                position: popup.position,
                messages: popup.messages,
                status: popup.status,
                isMinimized: popup.isMinimized
              }}
              onUpdate={handleUpdate}
              onClose={handleClose}
            />
          ) : (
            <SimpleChatPopup
              key={popup.id}
              id={popup.id}
              position={popup.position}
              projectId={popup.projectId}
              chapterId={popup.chapterId}
              selectedText={popup.selectedText || undefined}
              lineNumber={popup.lineNumber || undefined}
              isMinimized={popup.isMinimized}
              initialMessages={popup.messages}
            />
          ),
          document.body
        )
      )}
    </>
  );
};

export default SimplePopupRenderer;
