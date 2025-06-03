
import React, { createContext, useContext, useState, ReactNode } from 'react';
import PopupChat, { ChatType } from './PopupChat';

interface ChatSession {
  id: string;
  type: ChatType;
  position: { x: number; y: number };
  isMinimized: boolean;
  createdAt: Date;
  projectId: string;
  chapterId?: string;
}

interface PopupChatContextType {
  chats: ChatSession[];
  openChat: (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string) => void;
  closeChat: (id: string) => void;
  minimizeChat: (id: string) => void;
}

const PopupChatContext = createContext<PopupChatContextType | undefined>(undefined);

export const usePopupChats = () => {
  const context = useContext(PopupChatContext);
  if (!context) {
    throw new Error('usePopupChats must be used within a PopupChatProvider');
  }
  return context;
};

interface PopupChatProviderProps {
  children: ReactNode;
}

export const PopupChatProvider = ({ children }: PopupChatProviderProps) => {
  const [chats, setChats] = useState<ChatSession[]>([]);

  const openChat = (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string) => {
    const newChat: ChatSession = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      isMinimized: false,
      createdAt: new Date(),
      projectId,
      chapterId
    };
    
    setChats(prev => [...prev, newChat]);
  };

  const closeChat = (id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
  };

  const minimizeChat = (id: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isMinimized: !chat.isMinimized } : chat
    ));
  };

  return (
    <PopupChatContext.Provider value={{ chats, openChat, closeChat, minimizeChat }}>
      {children}
      {/* Render all popup chats */}
      {chats.map(chat => (
        <PopupChat
          key={chat.id}
          id={chat.id}
          type={chat.type}
          initialPosition={chat.position}
          onClose={() => closeChat(chat.id)}
          onMinimize={() => minimizeChat(chat.id)}
          isMinimized={chat.isMinimized}
          projectId={chat.projectId}
          chapterId={chat.chapterId}
        />
      ))}
    </PopupChatContext.Provider>
  );
};
