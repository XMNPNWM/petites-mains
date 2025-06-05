
import { supabase } from '@/integrations/supabase/client';
import { LocalChatSession, DbChatSession, convertDbToLocal, convertLocalToDb } from '@/types/comments';

export class ChatDatabaseService {
  static async saveChatSession(chat: LocalChatSession): Promise<void> {
    try {
      console.log('Saving chat to database:', chat.id);
      const dbChat = convertLocalToDb(chat);

      const { error } = await supabase
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
          status: dbChat.status || 'active',
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving chat:', error);
        throw error;
      }

      console.log('Chat saved successfully:', chat.id);
    } catch (error) {
      console.error('Error in saveChatSession:', error);
      throw error;
    }
  }

  static async loadProjectChats(projectId: string, status?: 'active' | 'closed'): Promise<LocalChatSession[]> {
    try {
      console.log('Loading chats for project:', projectId, 'with status:', status);
      
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        throw error;
      }

      console.log('Loaded chats from database:', data?.length || 0);
      return data ? data.map(convertDbToLocal) : [];
    } catch (error) {
      console.error('Error in loadProjectChats:', error);
      throw error;
    }
  }

  static async updateChatStatus(chatId: string, status: 'active' | 'closed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error updating chat status:', error);
        throw error;
      }

      console.log('Chat status updated successfully:', chatId, 'to', status);
    } catch (error) {
      console.error('Error in updateChatStatus:', error);
      throw error;
    }
  }

  static async loadChatById(chatId: string): Promise<LocalChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) {
        console.error('Error loading chat by ID:', error);
        throw error;
      }

      return data ? convertDbToLocal(data as DbChatSession) : null;
    } catch (error) {
      console.error('Error in loadChatById:', error);
      throw error;
    }
  }

  static async loadTimelineChats(projectId: string): Promise<any[]> {
    try {
      console.log('Fetching timeline chats for project:', projectId);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, project_id, chapter_id, chat_type, position, selected_text, text_position, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching timeline chats:', error);
        throw error;
      }

      console.log('Timeline chats loaded:', data?.length || 0);
      return data ? data.map(chat => ({
        ...chat,
        chat_type: chat.chat_type as 'comment' | 'coherence' | 'next-steps' | 'chat',
        position: chat.position as { x: number; y: number }
      })) : [];
    } catch (error) {
      console.error('Error in loadTimelineChats:', error);
      throw error;
    }
  }
}
