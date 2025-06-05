
import { useState, useRef } from 'react';
import { LocalChatSession } from '@/types/comments';

export const useChatState = () => {
  const [chats, setChats] = useState<LocalChatSession[]>([]);
  const isLoadingRef = useRef(false);

  const addChat = (chat: LocalChatSession) => {
    console.log('Adding new chat to state:', chat.id);
    setChats(prev => {
      const updated = [...prev, chat];
      console.log('Updated chats count:', updated.length);
      return updated;
    });
  };

  const removeChat = (chatId: string) => {
    console.log('Removing chat from state:', chatId);
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      console.log('Chats after removal:', filtered.length);
      return filtered;
    });
  };

  const updateChat = (chatId: string, updates: Partial<LocalChatSession>) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    ));
  };

  const findChat = (chatId: string) => {
    return chats.find(chat => chat.id === chatId);
  };

  const setAllChats = (newChats: LocalChatSession[]) => {
    setChats(newChats);
  };

  const getActiveChats = () => {
    return chats.filter(chat => chat.status === 'active');
  };

  return {
    chats,
    isLoadingRef,
    addChat,
    removeChat,
    updateChat,
    findChat,
    setAllChats,
    getActiveChats
  };
};
