
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import PopupChat, { ChatType } from './PopupChat';
import { SelectedTextContext, LocalChatSession, DbChatSession, convertDbToLocal, convertLocalToDb } from '@/types/comments';
import { supabase } from '@/integrations/supabase/client';

interface PopupChatContextType {
  chats: LocalChatSession[];
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

// Generate a proper UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const PopupChatProvider = ({ children }: PopupChatProviderProps) => {
  const [chats, setChats] = useState<LocalChatSession[]>([]);
  const isLoadingRef = useRef(false);

  const loadProjectChats = async (projectId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      console.log('Loading chats for project:', projectId);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      console.log('Loaded chats from database:', data?.length || 0);
      // Only load closed chats (those saved to database), not active ones
      // Active chats are managed in local state
    } catch (error) {
      console.error('Error loading project chats:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const saveChatToDatabase = async (chat: LocalChatSession) => {
    try {
      console.log('Saving chat to database:', chat.id);
      const dbChat = convertLocalToDb(chat);

      const { data, error } = await supabase
        .from('chat_sessions')
        .upsert(dbChat)
        .select();

      if (error) {
        console.error('Error saving chat:', error);
        throw error;
      } else {
        console.log('Chat saved successfully:', chat.id, data);
        return data;
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
      throw error;
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    console.log('Opening chat:', { type, position, projectId, chapterId, selectedText });
    
    // Ensure position is within viewport bounds
    const storylinePanelHeight = window.innerHeight * 0.3; // Approximate height
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - storylinePanelHeight - 520))
    };

    // Generate a proper UUID for the chat
    const chatId = generateUUID();

    const newChat: LocalChatSession = {
      id: chatId,
      type,
      position: safePosition,
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
    
    console.log('Adding new chat to state:', newChat.id);
    setChats(prev => {
      const updated = [...prev, newChat];
      console.log('Updated chats count:', updated.length);
      return updated;
    });
  };

  const closeChat = async (id: string) => {
    console.log('Closing chat:', id);
    
    // Find the chat to save it before removing
    const chatToClose = chats.find(chat => chat.id === id);
    if (chatToClose && chatToClose.messages && chatToClose.messages.length > 0) {
      try {
        // Only save chats that have messages
        await saveChatToDatabase(chatToClose);
        console.log('Chat saved to database before closing:', id);
      } catch (error) {
        console.error('Failed to save chat before closing:', error);
        // Continue with closing even if save failed
      }
    }
    
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== id);
      console.log('Chats after close:', filtered.length);
      return filtered;
    });
  };

  const minimizeChat = async (id: string) => {
    console.log('Minimizing chat:', id);
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        const updatedChat = { ...chat, isMinimized: !chat.isMinimized };
        // Update in memory, but don't save to database until closed
        return updatedChat;
      }
      return chat;
    }));
  };

  const saveChatMessage = async (chatId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    console.log('Saving message for chat:', chatId);
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = [...(chat.messages || []), message];
        const updatedChat = { ...chat, messages: updatedMessages };
        // Update in memory, but don't save to database until closed
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
