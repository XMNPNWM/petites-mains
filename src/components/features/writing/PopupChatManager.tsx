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
      lineNumber: lineNumber || null, // Fixed: use lineNumber instead of line_number
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

  const contextValue: PopupChatContextProps = {
    popups,
    createPopup,
    updatePopup,
    removePopup
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
