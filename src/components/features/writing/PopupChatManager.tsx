
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import PopupChat from './PopupChat';
import { SelectedTextContext, LocalChatSession } from '@/types/comments';
import { useChatDatabase } from '@/hooks/useChatDatabase';
import { useChatState } from '@/hooks/useChatState';
import { useToast } from '@/hooks/use-toast';

// Support both comment and chat types
type ChatType = 'comment' | 'chat';

interface PopupChatContextType {
  chats: LocalChatSession[];
  openChat: (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext, lineNumber?: number) => void;
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
  const { 
    chats, 
    addChat, 
    removeChat, 
    updateChat, 
    setAllChats,
    isLoadingRef 
  } = useChatState();
  
  const { 
    saveChat, 
    loadProjectChats: loadChatsFromDb, 
    updateChatStatus, 
    loadChatById 
  } = useChatDatabase();
  
  const { toast } = useToast();

  const loadProjectChats = async (projectId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      console.log('Loading active chats for project:', projectId);
      const activeChats = await loadChatsFromDb(projectId, 'active');
      console.log('Loaded active chats from database:', activeChats.length);
      setAllChats(activeChats);
    } catch (error) {
      console.error('Error loading project chats:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const openChat = async (type: ChatType, position: { x: number; y: number }, projectId: string, chapterId?: string, selectedText?: SelectedTextContext, lineNumber?: number) => {
    console.log('Opening chat:', { type, position, projectId, chapterId, selectedText, lineNumber });
    
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
      status: 'active',
      line_number: lineNumber
    };
    
    // Add initial message based on type
    if (type === 'comment' && selectedText) {
      newChat.messages = [{
        role: 'assistant',
        content: `You're commenting on: "${selectedText.text}"${lineNumber ? ` (Line ${lineNumber})` : ''}\n\nWhat would you like to note about this text?`,
        timestamp: new Date()
      }];
    } else if (type === 'chat') {
      newChat.messages = [{
        role: 'assistant',
        content: "Hello! I'm here to help with your writing. What would you like to discuss?",
        timestamp: new Date()
      }];
    }
    
    // Add chat to state first - this ensures it appears immediately
    console.log('Adding new chat to state:', newChat.id);
    addChat(newChat);
    
    // Save to database in background
    try {
      await saveChat(newChat);
      console.log('Chat saved to database successfully:', newChat.id);
    } catch (error) {
      console.error('Failed to save chat to database (chat will retry later):', error);
    }
  };

  const reopenChat = async (existingChatId: string) => {
    try {
      console.log('Reopening existing chat:', existingChatId);
      
      // Check if chat is already active
      const existingChat = chats.find(chat => chat.id === existingChatId);
      if (existingChat) {
        console.log('Chat is already active:', existingChatId);
        return;
      }

      // Load the existing chat from database
      const dbChat = await loadChatById(existingChatId);
      if (!dbChat) {
        console.error('Chat not found in database:', existingChatId);
        toast({
          title: "Error",
          description: "Chat not found",
          variant: "destructive"
        });
        return;
      }

      console.log('Loaded existing chat from database:', dbChat);
      
      // Calculate new safe position (slightly offset from original)
      const safePosition = {
        x: Math.max(20, Math.min(dbChat.position.x + 30, window.innerWidth - 420)),
        y: Math.max(20, Math.min(dbChat.position.y + 30, window.innerHeight - 520))
      };
      
      const reopenedChat = {
        ...dbChat,
        position: safePosition,
        status: 'active' as const
      };

      // Add to active chats immediately
      addChat(reopenedChat);

      // Update status in database in background
      try {
        await updateChatStatus(existingChatId, 'active');
        console.log('Chat status updated to active:', existingChatId);
      } catch (error) {
        console.error('Failed to update chat status (chat still reopened):', error);
      }
    } catch (error) {
      console.error('Error reopening chat:', error);
      toast({
        title: "Error",
        description: "Failed to reopen chat",
        variant: "destructive"
      });
    }
  };

  const closeChat = async (id: string) => {
    console.log('Closing chat:', id);
    
    // Remove from active state immediately
    removeChat(id);
    
    // Mark as closed in database in background
    try {
      await updateChatStatus(id, 'closed');
      console.log('Chat marked as closed in database:', id);
    } catch (error) {
      console.error('Failed to update chat status to closed:', error);
    }
  };

  const minimizeChat = async (id: string) => {
    console.log('Minimizing chat:', id);
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const updatedChat = { ...chat, isMinimized: !chat.isMinimized };
    updateChat(id, { isMinimized: updatedChat.isMinimized });
    
    // Save to database in background
    try {
      await saveChat(updatedChat);
    } catch (error) {
      console.error('Failed to save minimize state:', error);
    }
  };

  const saveChatMessage = async (chatId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: Date }) => {
    console.log('Saving message for chat:', chatId);
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const updatedMessages = [...(chat.messages || []), message];
    const updatedChat = { ...chat, messages: updatedMessages };
    
    // Update state immediately
    updateChat(chatId, { messages: updatedMessages });
    
    // Save to database in background
    try {
      await saveChat(updatedChat);
    } catch (error) {
      console.error('Failed to save message to database:', error);
    }
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
      {/* Render all active popup chats - both comment and chat types */}
      {chats.filter(chat => chat.status === 'active' && (chat.type === 'comment' || chat.type === 'chat')).map(chat => (
        <PopupChat
          key={chat.id}
          id={chat.id}
          type={chat.type as ChatType}
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
