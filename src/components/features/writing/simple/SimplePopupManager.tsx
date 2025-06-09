
import React, { createContext, useContext, useState, ReactNode } from 'react';
import SimpleChatPopup, { ChatType } from './SimpleChatPopup';
import { ChatDatabaseService } from '@/services/ChatDatabaseService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PopupData {
  id: string;
  type: ChatType;
  position: { x: number; y: number };
  selectedText?: string;
  isMinimized: boolean;
  messages: Message[];
  projectId: string;
  chapterId?: string;
}

interface SimplePopupContextType {
  popups: PopupData[];
  createPopup: (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => void;
  reopenPopup: (id: string, type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => void;
  closePopup: (id: string) => void;
  minimizePopup: (id: string) => void;
  addMessage: (id: string, message: Message) => void;
  timelineVersion: number;
}

const SimplePopupContext = createContext<SimplePopupContextType | undefined>(undefined);

export const useSimplePopups = () => {
  const context = useContext(SimplePopupContext);
  if (!context) {
    throw new Error('useSimplePopups must be used within a SimplePopupProvider');
  }
  return context;
};

interface SimplePopupProviderProps {
  children: ReactNode;
}

export const SimplePopupProvider = ({ children }: SimplePopupProviderProps) => {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [timelineVersion, setTimelineVersion] = useState(0);

  // Generate proper UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const triggerTimelineRefresh = () => {
    setTimelineVersion(prev => prev + 1);
  };

  const createPopup = (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => {
    // Ensure position is within viewport bounds
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
    };

    const newPopup: PopupData = {
      id: generateUUID(), // Use proper UUID
      type,
      position: safePosition,
      selectedText,
      isMinimized: false,
      messages: type === 'comment' && selectedText ? [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }] : [],
      projectId,
      chapterId
    };

    setPopups(prev => [...prev, newPopup]);

    // Save to timeline in background and trigger refresh
    setTimeout(async () => {
      try {
        await saveToTimeline(newPopup);
        triggerTimelineRefresh();
      } catch (error) {
        console.log('Timeline save failed (non-blocking):', error);
      }
    }, 0);
  };

  const reopenPopup = async (id: string, type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => {
    // Check if popup is already open
    const existingPopup = popups.find(popup => popup.id === id);
    if (existingPopup) {
      // Just bring it to front by minimizing/unminimizing
      setPopups(prev => prev.map(popup => 
        popup.id === id ? { ...popup, isMinimized: false } : popup
      ));
      return;
    }

    try {
      // Try to load existing chat from database
      const dbChat = await ChatDatabaseService.loadChatById(id);
      
      if (dbChat) {
        // Convert database chat to popup format
        const safePosition = {
          x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
          y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
        };

        const reopenedPopup: PopupData = {
          id,
          type: dbChat.type as ChatType,
          position: safePosition,
          selectedText: dbChat.selectedText?.text || selectedText,
          isMinimized: false,
          messages: (dbChat.messages || []).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          })),
          projectId,
          chapterId: dbChat.chapterId
        };

        setPopups(prev => [...prev, reopenedPopup]);

        // Update timeline status in background
        setTimeout(async () => {
          try {
            await updateTimelineStatus(id, 'active');
            triggerTimelineRefresh();
          } catch (error) {
            console.log('Timeline status update failed (non-blocking):', error);
          }
        }, 0);
      } else {
        // Create a new popup if not found in database
        const safePosition = {
          x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
          y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
        };

        const newPopup: PopupData = {
          id,
          type,
          position: safePosition,
          selectedText,
          isMinimized: false,
          messages: [],
          projectId,
          chapterId
        };

        setPopups(prev => [...prev, newPopup]);
      }
    } catch (error) {
      console.error('Error reopening popup from timeline:', error);
      // Fallback: create new popup
      createPopup(type, position, projectId, chapterId, selectedText);
    }
  };

  const closePopup = (id: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
    
    // Update timeline status in background and trigger refresh
    setTimeout(async () => {
      try {
        await updateTimelineStatus(id, 'closed');
        triggerTimelineRefresh();
      } catch (error) {
        console.log('Timeline status update failed (non-blocking):', error);
        // Still trigger refresh even if update failed
        triggerTimelineRefresh();
      }
    }, 0);
  };

  const minimizePopup = (id: string) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, isMinimized: !popup.isMinimized } : popup
    ));
  };

  const addMessage = (id: string, message: Message) => {
    setPopups(prev => prev.map(popup => 
      popup.id === id ? { ...popup, messages: [...popup.messages, message] } : popup
    ));

    // Save message to timeline in background
    setTimeout(async () => {
      try {
        await saveMessageToTimeline(id, message);
      } catch (error) {
        console.log('Timeline message save failed (non-blocking):', error);
      }
    }, 0);
  };

  // Background timeline storage functions (fire and forget)
  const saveToTimeline = async (popup: PopupData) => {
    try {
      console.log('Saving popup to timeline:', popup.id);
      
      const chatSession = {
        id: popup.id,
        projectId: popup.projectId,
        chapterId: popup.chapterId,
        type: popup.type,
        position: popup.position,
        selectedText: popup.selectedText ? {
          text: popup.selectedText,
          startOffset: 0,
          endOffset: popup.selectedText.length
        } : undefined,
        messages: popup.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        isMinimized: popup.isMinimized,
        createdAt: new Date(),
        status: 'active' as const
      };

      await ChatDatabaseService.saveChatSession(chatSession);
      console.log('Successfully saved to timeline:', popup.id);
    } catch (error) {
      console.error('Timeline save failed:', error);
      throw error; // Re-throw so calling code can handle
    }
  };

  const updateTimelineStatus = async (id: string, status: string) => {
    try {
      console.log('Updating timeline status:', id, status);
      await ChatDatabaseService.updateChatStatus(id, status as 'active' | 'closed');
      console.log('Successfully updated timeline status:', id, status);
    } catch (error) {
      console.error('Timeline status update failed:', error);
      throw error; // Re-throw so calling code can handle
    }
  };

  const saveMessageToTimeline = async (id: string, message: Message) => {
    try {
      console.log('Saving message to timeline:', id);
      
      // Load existing chat and update with new message
      const existingChat = await ChatDatabaseService.loadChatById(id);
      if (existingChat) {
        const updatedMessages = [...(existingChat.messages || []), {
          role: message.role,
          content: message.content,
          timestamp: message.timestamp
        }];
        
        const updatedChat = {
          ...existingChat,
          messages: updatedMessages
        };
        
        await ChatDatabaseService.saveChatSession(updatedChat);
      }
    } catch (error) {
      console.log('Timeline message save failed (non-blocking):', error);
    }
  };

  return (
    <SimplePopupContext.Provider value={{ 
      popups, 
      createPopup, 
      reopenPopup,
      closePopup, 
      minimizePopup, 
      addMessage,
      timelineVersion
    }}>
      {children}
      {/* Render all active popups */}
      {popups.map(popup => (
        <SimpleChatPopup
          key={popup.id}
          id={popup.id}
          type={popup.type}
          position={popup.position}
          selectedText={popup.selectedText}
          onClose={() => closePopup(popup.id)}
          onMinimize={() => minimizePopup(popup.id)}
          onMessage={(message) => addMessage(popup.id, message)}
          isMinimized={popup.isMinimized}
          messages={popup.messages}
        />
      ))}
    </SimplePopupContext.Provider>
  );
};
