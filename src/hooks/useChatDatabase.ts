
import { useCallback } from 'react';
import { ChatDatabaseService } from '@/services/ChatDatabaseService';
import { LocalChatSession } from '@/types/comments';

export const useChatDatabase = () => {
  const saveChat = useCallback(async (chat: LocalChatSession) => {
    try {
      await ChatDatabaseService.saveChatSession(chat);
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  }, []);

  const loadProjectChats = useCallback(async (projectId: string, status?: 'active' | 'closed') => {
    try {
      return await ChatDatabaseService.loadProjectChats(projectId, status);
    } catch (error) {
      console.error('Failed to load project chats:', error);
      return [];
    }
  }, []);

  const updateChatStatus = useCallback(async (chatId: string, status: 'active' | 'closed') => {
    try {
      await ChatDatabaseService.updateChatStatus(chatId, status);
    } catch (error) {
      console.error('Failed to update chat status:', error);
    }
  }, []);

  const loadChatById = useCallback(async (chatId: string) => {
    try {
      return await ChatDatabaseService.loadChatById(chatId);
    } catch (error) {
      console.error('Failed to load chat by ID:', error);
      return null;
    }
  }, []);

  const loadTimelineChats = useCallback(async (projectId: string) => {
    try {
      return await ChatDatabaseService.loadTimelineChats(projectId);
    } catch (error) {
      console.error('Failed to load timeline chats:', error);
      return [];
    }
  }, []);

  return {
    saveChat,
    loadProjectChats,
    updateChatStatus,
    loadChatById,
    loadTimelineChats
  };
};
