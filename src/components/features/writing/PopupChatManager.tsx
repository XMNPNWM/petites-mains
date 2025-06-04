
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

export const PopupChatProvider = ({ children }: PopupChatProviderProps) => {
  const [chats, setChats] = useState<LocalChatSession[]>([]);
  const isLoadingRef = useRef(false);
  const chatCreationDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
      // Convert database format to local format
      const localChats: LocalChatSession[] = (data as DbChatSession[]).map(convertDbToLocal);
      setChats(localChats);
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

      const { error } = await supabase
        .from('chat_sessions')
        .upsert(dbChat);

      if (error) {
        console.error('Error saving chat:', error);
      } else {
        console.log('Chat saved successfully:', chat.id);
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    console.log('Opening chat:', { type, position, projectId, chapterId, selectedText });
    
    // Create debounce key to prevent rapid creation
    const debounceKey = `${type}-${position.x}-${position.y}`;
    
    // Clear existing timeout for this key if any
    const existingTimeout = chatCreationDebounceRef.current.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout for debounced chat creation
    const timeout = setTimeout(async () => {
      // Ensure position is within viewport bounds
      const safePosition = {
        x: Math.max(20, Math.min(position.x, window.innerWidth - 420)),
        y: Math.max(20, Math.min(position.y, window.innerHeight - 520))
      };

      const newChat: LocalChatSession = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      
      // Save to database
      await saveChatToDatabase(newChat);
      
      // Remove from debounce map
      chatCreationDebounceRef.current.delete(debounceKey);
    }, 100); // 100ms debounce
    
    chatCreationDebounceRef.current.set(debounceKey, timeout);
  };

  const closeChat = async (id: string) => {
    console.log('Closing chat:', id);
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== id);
      console.log('Chats after close:', filtered.length);
      return filtered;
    });
    
    try {
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      console.log('Chat deleted from database:', id);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const minimizeChat = async (id: string) => {
    console.log('Minimizing chat:', id);
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
    console.log('Saving message for chat:', chatId);
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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      chatCreationDebounceRef.current.forEach(timeout => clearTimeout(timeout));
      chatCreationDebounceRef.current.clear();
    };
  }, []);

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
