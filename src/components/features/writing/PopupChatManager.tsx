
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import PopupChat, { ChatType } from './PopupChat';
import { SelectedTextContext, LocalChatSession, DbChatSession, convertDbToLocal, convertLocalToDb } from '@/types/comments';
import { supabase } from '@/integrations/supabase/client';

interface PopupChatContextType {
  chats: LocalChatSession[];
  openChat: (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => void;
  reopenChat: (existingChatId: string) => Promise<void>;
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

  const loadProjectChats = async (projectId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      console.log('Loading chats for project:', projectId);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      console.log('Loaded active chats from database:', data?.length || 0);
      // Convert database format to local format and only show active chats
      if (data) {
        const localChats: LocalChatSession[] = data.map(convertDbToLocal);
        setChats(localChats);
      }
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

      // Use a raw SQL query to handle the status field properly
      const { error } = await supabase.rpc('upsert_chat_session', {
        p_id: dbChat.id,
        p_project_id: dbChat.project_id,
        p_chapter_id: dbChat.chapter_id,
        p_chat_type: dbChat.chat_type,
        p_position: dbChat.position,
        p_messages: dbChat.messages,
        p_selected_text: dbChat.selected_text,
        p_text_position: dbChat.text_position,
        p_is_minimized: dbChat.is_minimized,
        p_status: dbChat.status || 'active'
      }).then(() => ({ error: null })).catch((err) => ({ error: err }));

      // Fallback to direct table upsert if RPC doesn't exist
      if (error) {
        console.log('RPC not available, using direct upsert');
        const { error: upsertError } = await supabase
          .from('chat_sessions')
          .upsert({
            id: dbChat.id,
            project_id: dbChat.project_id,
            chapter_id: dbChat.chapter_id,
            chat_type: dbChat.chat_type,
            position: dbChat.position,
            messages: dbChat.messages,
            selected_text: dbChat.selected_text,
            text_position: dbChat.text_position,
            is_minimized: dbChat.is_minimized,
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Error saving chat:', upsertError);
        } else {
          console.log('Chat saved successfully:', chat.id);
        }
      } else {
        console.log('Chat saved successfully via RPC:', chat.id);
      }
    } catch (error) {
      console.error('Error saving chat to database:', error);
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext) => {
    console.log('Opening chat:', { type, position, projectId, chapterId, selectedText });
    
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
      messages: [],
      status: 'active'
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
  };

  const reopenChat = async (existingChatId: string) => {
    try {
      console.log('Reopening existing chat:', existingChatId);
      
      // Check if chat is already active
      if (chats.find(chat => chat.id === existingChatId)) {
        console.log('Chat is already active:', existingChatId);
        return;
      }

      // Load the existing chat from database
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', existingChatId)
        .single();

      if (error) {
        console.error('Error loading existing chat:', error);
        return;
      }

      if (data) {
        console.log('Loaded existing chat from database:', data);
        const localChat = convertDbToLocal(data as DbChatSession);
        localChat.status = 'active';

        // Calculate new safe position (slightly offset from original)
        const safePosition = {
          x: Math.max(20, Math.min(localChat.position.x + 30, window.innerWidth - 420)),
          y: Math.max(20, Math.min(localChat.position.y + 30, window.innerHeight - 520))
        };
        localChat.position = safePosition;

        // Add to active chats
        setChats(prev => [...prev, localChat]);

        // Update status in database using direct update
        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingChatId);

        console.log('Chat reopened successfully:', existingChatId);
      }
    } catch (error) {
      console.error('Error reopening chat:', error);
    }
  };

  const closeChat = async (id: string) => {
    console.log('Closing chat:', id);
    
    // Remove from active state
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== id);
      console.log('Chats after close:', filtered.length);
      return filtered;
    });
    
    // Mark as closed in database instead of deleting
    try {
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
      console.log('Chat marked as closed in database:', id);
    } catch (error) {
      console.error('Error closing chat:', error);
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

  return (
    <PopupChatContext.Provider value={{ 
      chats, 
      openChat, 
      reopenChat,
      closeChat, 
      minimizeChat, 
      saveChatMessage,
      loadProjectChats 
    }}>
      {children}
      {/* Render all active popup chats */}
      {chats.filter(chat => chat.status === 'active').map(chat => (
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
