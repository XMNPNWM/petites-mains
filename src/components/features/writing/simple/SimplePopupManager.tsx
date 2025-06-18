
import React, { createContext, useState, useContext } from 'react';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { SimplePopup, PopupContextProps } from './types/popupTypes';
import { usePopupCreation } from './hooks/usePopupCreation';
import { usePopupNavigation } from './hooks/usePopupNavigation';

const SimplePopupsContext = createContext<PopupContextProps | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupsContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

export const SimplePopupProvider = ({ children }: { children: React.ReactNode }) => {
  const [livePopups, setLivePopups] = useState<SimplePopup[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const { saveChat, loadChatById, updateChatStatus, deleteChat } = useChatDatabase();
  const { createPopupData } = usePopupCreation();
  const { goToLine } = usePopupNavigation();

  const createPopup = async (
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string, 
    lineNumber?: number
  ) => {
    const newPopup = createPopupData(type, position, projectId, chapterId, selectedText, lineNumber);
    
    setLivePopups(prevPopups => [...prevPopups, newPopup]);
    setTimelineVersion(prev => prev + 1);

    // Enhanced database save with validated navigation data
    const chatSession = {
      id: newPopup.id,
      type: newPopup.type,
      position: newPopup.position,
      isMinimized: newPopup.isMinimized,
      createdAt: newPopup.createdAt,
      projectId: newPopup.projectId,
      chapterId: newPopup.chapterId,
      selectedText: newPopup.selectedText ? {
        text: newPopup.selectedText,
        startOffset: newPopup.textPosition || 0,
        endOffset: (newPopup.textPosition || 0) + newPopup.selectedText.length,
        lineNumber: newPopup.lineNumber
      } : undefined,
      lineNumber: newPopup.lineNumber,
      messages: newPopup.messages,
      status: 'active' as const
    };

    try {
      await saveChat(chatSession);
      console.log('Popup saved to database with validated navigation data:', {
        id: newPopup.id,
        lineNumber: newPopup.lineNumber,
        chapterId: newPopup.chapterId,
        hasValidNavigation: !!(newPopup.chapterId && newPopup.lineNumber)
      });
    } catch (error) {
      console.error('Failed to save popup to database:', error);
    }
  };

  const updatePopup = (id: string, updates: Partial<SimplePopup>) => {
    setLivePopups(prevPopups => 
      prevPopups.map(popup => 
        popup.id === id ? { ...popup, ...updates } : popup
      )
    );
    setTimelineVersion(prev => prev + 1);
  };

  const closePopup = async (id: string) => {
    setLivePopups(prevPopups => prevPopups.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);

    try {
      await updateChatStatus(id, 'closed');
      console.log('Popup marked as closed in database:', id);
    } catch (error) {
      console.error('Failed to update popup status:', error);
    }
  };

  const deletePopup = async (id: string) => {
    setLivePopups(prevPopups => prevPopups.filter(popup => popup.id !== id));
    setTimelineVersion(prev => prev + 1);

    try {
      await deleteChat(id);
      console.log('Popup permanently deleted from database:', id);
    } catch (error) {
      console.error('Failed to delete popup from database:', error);
    }
  };

  const reopenPopup = async (
    id: string, 
    type: 'comment' | 'chat', 
    position: { x: number; y: number }, 
    projectId: string, 
    chapterId?: string, 
    selectedText?: string
  ) => {
    console.log('Reopening popup with navigation data restoration:', id);

    const existingPopup = livePopups.find(popup => popup.id === id);
    if (existingPopup) {
      console.log('Popup is already open:', id);
      return;
    }

    try {
      const dbChat = await loadChatById(id);
      if (!dbChat) {
        console.error('Popup not found in database:', id);
        return;
      }

      console.log('Loaded chat data with navigation validation:', {
        id: dbChat.id,
        chapterId: dbChat.chapterId,
        lineNumber: dbChat.lineNumber,
        selectedText: dbChat.selectedText,
        hasValidNavigation: !!(dbChat.chapterId && dbChat.lineNumber)
      });

      const safePosition = {
        x: Math.max(20, Math.min(position.x + 30, window.innerWidth - (type === 'comment' ? 370 : 470))),
        y: Math.max(20, Math.min(position.y + 30, window.innerHeight - (type === 'comment' ? 420 : 570)))
      };

      const reopenedPopup: SimplePopup = {
        id: dbChat.id,
        type: dbChat.type,
        position: safePosition,
        projectId: dbChat.projectId,
        chapterId: dbChat.chapterId,
        selectedText: dbChat.selectedText?.text || null,
        lineNumber: dbChat.lineNumber || null,
        isMinimized: false,
        createdAt: dbChat.createdAt,
        messages: dbChat.messages || [],
        status: 'open',
        textPosition: dbChat.selectedText?.startOffset || null
      };

      console.log('Reopened popup with navigation data verified:', {
        id: reopenedPopup.id,
        chapterId: reopenedPopup.chapterId,
        lineNumber: reopenedPopup.lineNumber,
        textPosition: reopenedPopup.textPosition,
        selectedText: reopenedPopup.selectedText,
        hasValidNavigation: !!(reopenedPopup.chapterId && reopenedPopup.lineNumber)
      });

      setLivePopups(prevPopups => [...prevPopups, reopenedPopup]);
      setTimelineVersion(prev => prev + 1);

      await updateChatStatus(id, 'active');
      console.log('Popup reopened successfully with navigation data validated');
    } catch (error) {
      console.error('Error reopening popup:', error);
    }
  };

  return (
    <SimplePopupsContext.Provider 
      value={{
        livePopups,
        popups: livePopups,
        createPopup,
        updatePopup,
        closePopup,
        deletePopup,
        reopenPopup,
        goToLine,
        timelineVersion
      }}
    >
      {children}
    </SimplePopupsContext.Provider>
  );
};
