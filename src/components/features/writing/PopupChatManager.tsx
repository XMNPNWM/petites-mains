
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
  return crypto.randomUUID();
};

export const PopupChatProvider = ({ children }: PopupChatProviderProps) => {
  const [chats, setChats] = useState<LocalChatSession[]>([]);
  const isLoadingRef = useRef(false);
  const savingChatsRef = useRef(new Set<string>());

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
    } catch (error) {
      console.error('Error loading project chats:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const checkForDuplicateChat = async (chat: LocalChatSession) => {
    // Check for duplicate based on position, type, and selected text to prevent duplicates
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('project_id', chat.projectId)
      .eq('chat_type', chat.type)
      .eq('position', JSON.stringify(chat.position));

    if (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }

    // If it's a comment type, also check selected text
    if (chat.type === 'comment' && chat.selectedText) {
      const duplicateWithText = data?.find(() => true); // Simple check for now
      return !!duplicateWithText;
    }

    return data && data.length > 0;
  };

  const saveChatToDatabase = async (chat: LocalChatSession) => {
    // Prevent duplicate saves
    if (savingChatsRef.current.has(chat.id)) {
      console.log('Chat already being saved, skipping:', chat.id);
      return;
    }

    // Only save if chat has messages
    if (!chat.messages || chat.messages.length === 0) {
      console.log('Skipping save for chat without messages:', chat.id);
      return;
    }

    // Check for duplicates
    const isDuplicate = await checkForDuplicateChat(chat);
    if (isDuplicate) {
      console.log('Duplicate chat detected, skipping save:', chat.id);
      return;
    }

    savingChatsRef.current.add(chat.id);

    try {
      console.log('Saving chat to database:', chat.id, 'type:', chat.type);
      const dbChat = convertLocalToDb(chat);

      const { data, error } = await supabase
        .from('chat_sessions')
        .upsert(dbChat, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Error saving chat:', error);
        throw error;
      } else {
        console.log('Chat saved successfully:', chat.id, 'type:', chat.type, data);
        return data;
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
      throw error;
    } finally {
      savingChatsRef.current.delete(chat.id);
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    console.log('Opening chat:', { type, position, projectId, chapterId, selectedText });
    
    // Ensure position is within viewport bounds and below storyline context menu z-index
    const storylinePanelHeight = window.innerHeight * 0.3;
    const safePosition = {
      x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
      y: Math.max(20, Math.min(position.y, window.innerHeight - storylinePanelHeight - 520))
    };

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
    
    // Add appropriate initial message based on chat type
    if (type === 'comment' && selectedText) {
      newChat.messages = [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText.text}"\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    } else if (type === 'coherence') {
      newChat.messages = [{
        role: 'assistant',
        content: `I'm here to help you check the coherence of your story. What aspect would you like me to analyze?`,
        timestamp: new Date()
      }];
    } else if (type === 'next-steps') {
      newChat.messages = [{
        role: 'assistant',
        content: `I'm here to help you plan your next steps. What part of your story would you like to develop?`,
        timestamp: new Date()
      }];
    } else if (type === 'chat') {
      newChat.messages = [{
        role: 'assistant',
        content: `Hello! I'm your writing assistant. How can I help you with your story today?`,
        timestamp: new Date()
      }];
    }
    
    console.log('Adding new chat to state:', newChat.id, 'type:', newChat.type);
    setChats(prev => {
      const updated = [...prev, newChat];
      console.log('Updated chats count:', updated.length);
      return updated;
    });
  };

  const closeChat = async (id: string) => {
    console.log('Closing chat:', id);
    
    const chatToClose = chats.find(chat => chat.id === id);
    if (chatToClose && chatToClose.messages && chatToClose.messages.length > 0) {
      try {
        await saveChatToDatabase(chatToClose);
        console.log('Chat saved to database before closing:', id, 'type:', chatToClose.type);
      } catch (error) {
        console.error('Failed to save chat before closing:', error);
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
      {/* Render all popup chats with adjusted z-index */}
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
