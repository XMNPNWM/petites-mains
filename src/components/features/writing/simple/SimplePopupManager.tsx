
import React, { createContext, useContext, useState, ReactNode } from 'react';
import SimpleChatPopup, { ChatType } from './SimpleChatPopup';

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
  closePopup: (id: string) => void;
  minimizePopup: (id: string) => void;
  addMessage: (id: string, message: Message) => void;
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

  const createPopup = (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: string) => {
    // Ensure position is within viewport bounds
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
    };

    const newPopup: PopupData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    // Save to timeline in background (fire and forget)
    setTimeout(() => {
      saveToTimeline(newPopup);
    }, 0);
  };

  const closePopup = (id: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
    
    // Update timeline status in background
    setTimeout(() => {
      updateTimelineStatus(id, 'closed');
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
    setTimeout(() => {
      saveMessageToTimeline(id, message);
    }, 0);
  };

  // Background timeline storage functions (fire and forget)
  const saveToTimeline = async (popup: PopupData) => {
    try {
      // This will be a simple background save - no error handling needed in UI
      console.log('Saving popup to timeline:', popup.id);
      // Implementation will be added later to integrate with existing database
    } catch (error) {
      console.log('Timeline save failed (non-blocking):', error);
    }
  };

  const updateTimelineStatus = async (id: string, status: string) => {
    try {
      console.log('Updating timeline status:', id, status);
      // Implementation will be added later
    } catch (error) {
      console.log('Timeline status update failed (non-blocking):', error);
    }
  };

  const saveMessageToTimeline = async (id: string, message: Message) => {
    try {
      console.log('Saving message to timeline:', id);
      // Implementation will be added later
    } catch (error) {
      console.log('Timeline message save failed (non-blocking):', error);
    }
  };

  return (
    <SimplePopupContext.Provider value={{ 
      popups, 
      createPopup, 
      closePopup, 
      minimizePopup, 
      addMessage 
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
