
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import PopupChat, { ChatType } from './PopupChat';
import { SelectedTextContext, ChatSession } from '@/types/comments';
import { supabase } from '@/integrations/supabase/client';

interface ChatSessionLocal {
  id: string;
  type: ChatType;
  position: { x: number; y: number };
  isMinimized: boolean;
  createdAt: Date;
  projectId: string;
  chapterId?: string;
  selectedText?: SelectedTextContext;
  messages?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
}

interface PopupChatContextType {
  chats: ChatSessionLocal[];
  openChat: (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => void;
  closeChat: (id: string) => void;
  minimizeChat: (id: string) => void;
  saveChatMessage: (chatId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => Promise<void>;
  loadProjectChats: (projectId: string) => Promise<void>;
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
  const [chats, setChats] = useState<ChatSessionLocal[]>([]);

  const loadProjectChats = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      // Convert database format to local format
      const localChats: ChatSessionLocal[] = data.map((session: ChatSession) => ({
        id: session.id,
        type: session.chat_type,
        position: session.position,
        isMinimized: session.is_minimized,
        createdAt: new Date(session.created_at),
        projectId: session.project_id,
        chapterId: session.chapter_id,
        selectedText: session.selected_text ? {
          text: session.selected_text,
          startOffset: session.text_position || 0,
          endOffset: (session.text_position || 0) + session.selected_text.length
        } : undefined,
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));

      setChats(localChats);
    } catch (error) {
      console.error('Error loading project chats:', error);
    }
  };

  const saveChatToDatabase = async (chat: ChatSessionLocal) => {
    try {
      const dbChat = {
        id: chat.id,
        project_id: chat.projectId,
        chapter_id: chat.chapterId,
        chat_type: chat.type,
        position: chat.position,
        messages: chat.messages || [],
        selected_text: chat.selectedText?.text,
        text_position: chat.selectedText?.startOffset,
        is_minimized: chat.isMinimized
      };

      const { error } = await supabase
        .from('chat_sessions')
        .upsert(dbChat);

      if (error) {
        console.error('Error saving chat:', error);
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    const newChat: ChatSessionLocal = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      isMinimized: false,
      createdAt: new Date(),
      projectId,
      chapterId,
      selectedText,
      messages: []
    };
    
    // Add initial message for comment type
    if (type === 'comment' && selectedText) {
      newChat.messages = [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText.text}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    }
    
    setChats(prev => [...prev, newChat]);
    await saveChatToDatabase(newChat);
  };

  const closeChat = async (id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    
    try {
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const minimizeChat = async (id: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        const updatedChat = { ...chat, isMinimized: !chat.isMinimized };
        saveChatToDatabase(updatedChat);
        return updatedChat;
      }
      return chat;
    }));
  };

  const saveChatMessage = async (chatId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = [...(chat.messages || []), message];
        const updatedChat = { ...chat, messages: updatedMessages };
        saveChatToDatabase(updatedChat);
        return updatedChat;
      }
      return chat;
    }));
  };

  return (
    <PopupChatContext.Provider value={{ 
      chats, 
      openChat, 
      closeChat, 
      minimizeChat, 
      saveChatMessage,
      loadProjectChats 
    }}>
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
          selectedText={chat.selectedText}
          initialMessages={chat.messages}
        />
      ))}
    </PopupChatContext.Provider>
  );
};
