
import React, { createContext, useState, useCallback, useContext } from 'react';

// Define the types
export type ChatType = 'comment' | 'chat';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'assistant';
}

export interface LocalChatSession {
  id: string;
  projectId: string;
  chapterId: string | null;
  chatType: ChatType;
  position: { x: number; y: number };
  messages: ChatMessage[];
  selectedText: string | null;
  lineNumber: number | null;
  isMinimized: boolean;
  status: 'active' | 'inactive';
}

interface PopupChatContextProps {
  popups: LocalChatSession[];
  createPopup: (
    type: ChatType,
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => void;
  updatePopup: (id: string, updates: Partial<LocalChatSession>) => void;
  removePopup: (id: string) => void;
  saveChatMessage: (id: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => Promise<void>;
}

const PopupChatContext = createContext<PopupChatContextProps | undefined>(undefined);

interface PopupChatProviderProps {
  children: React.ReactNode;
}

const PopupChatManager = ({ children }: PopupChatProviderProps) => {
  const [popups, setPopups] = useState<LocalChatSession[]>([]);

  const createPopup = useCallback((
    type: ChatType,
    position: { x: number; y: number },
    projectId: string,
    chapterId?: string,
    selectedText?: string,
    lineNumber?: number
  ) => {
    console.log('Creating popup:', { type, position, projectId, chapterId, selectedText, lineNumber });
    
    const newPopup: LocalChatSession = {
      id: `temp_${Date.now()}`,
      projectId,
      chapterId: chapterId || null,
      chatType: type,
      position,
      messages: [],
      selectedText: selectedText || null,
      lineNumber: lineNumber || null,
      isMinimized: false,
      status: 'active'
    };

    setPopups(prev => [...prev, newPopup]);
  }, []);

  const updatePopup = useCallback((id: string, updates: Partial<LocalChatSession>) => {
    setPopups(prev =>
      prev.map(popup => (popup.id === id ? { ...popup, ...updates } : popup))
    );
  }, []);

  const removePopup = useCallback((id: string) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  }, []);

  const saveChatMessage = useCallback(async (
    id: string, 
    message: { role: 'user' | 'assistant'; content: string; timestamp: Date }
  ) => {
    try {
      console.log('Saving chat message:', { id, message });
      
      // Convert to the format expected by LocalChatSession
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        sender: message.role
      };

      // Update the popup with the new message
      setPopups(prev =>
        prev.map(popup => 
          popup.id === id 
            ? { ...popup, messages: [...popup.messages, chatMessage] }
            : popup
        )
      );

      // Here you could also save to a database if needed
      // await ChatDatabaseService.saveChatMessage(id, message);
      
    } catch (error) {
      console.error('Failed to save chat message:', error);
      throw error;
    }
  }, []);

  const contextValue: PopupChatContextProps = {
    popups,
    createPopup,
    updatePopup,
    removePopup,
    saveChatMessage
  };

  return (
    <PopupChatContext.Provider value={contextValue}>
      {children}
    </PopupChatContext.Provider>
  );
};

export const usePopupChat = () => {
  const context = useContext(PopupChatContext);
  if (!context) {
    throw new Error("usePopupChat must be used within a PopupChatProvider");
  }
  return context;
};

export { PopupChatManager, PopupChatContext };
