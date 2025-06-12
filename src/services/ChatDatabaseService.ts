
import { supabase } from '@/integrations/supabase/client';
import { LocalChatSession, convertLocalToDb, convertDbToLocal } from '@/types/comments';

export class ChatDatabaseService {
  static async saveChatSession(chat: LocalChatSession): Promise<void> {
    try {
      console.log('Saving chat session to database:', chat.id);
      
      const dbData = convertLocalToDb(chat);
      
      const { error } = await supabase
        .from('chat_sessions')
        .upsert(dbData, { onConflict: 'id' });

      if (error) {
        console.error('Error saving chat session:', error);
        throw error;
      }

      console.log('Chat session saved successfully:', chat.id);
    } catch (error) {
      console.error('Failed to save chat session:', error);
      throw error;
    }
  }

  static async loadProjectChats(projectId: string, status?: 'active' | 'closed'): Promise<LocalChatSession[]> {
    try {
      console.log('Loading project chats:', { projectId, status });
      
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('project_id', projectId)
        .in('chat_type', ['comment', 'chat']); // Only load comment and chat types

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading project chats:', error);
        throw error;
      }

      console.log('Loaded project chats from database:', data?.length || 0);
      return (data || []).map(convertDbToLocal);
    } catch (error) {
      console.error('Failed to load project chats:', error);
      throw error;
    }
  }

  static async updateChatStatus(chatId: string, status: 'active' | 'closed'): Promise<void> {
    try {
      console.log('Updating chat status:', { chatId, status });
      
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

      console.log('Chat status updated successfully:', { chatId, status });
    } catch (error) {
      console.error('Failed to update chat status:', error);
      throw error;
    }
  }

  static async loadChatById(chatId: string): Promise<LocalChatSession | null> {
    try {
      console.log('Loading chat by ID:', chatId);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', chatId)
        .in('chat_type', ['comment', 'chat']) // Only load comment and chat types
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Chat not found:', chatId);
          return null;
        }
        console.error('Error loading chat by ID:', error);
        throw error;
      }

      console.log('Loaded chat by ID:', data);
      return convertDbToLocal(data);
    } catch (error) {
      console.error('Failed to load chat by ID:', error);
      throw error;
    }
  }

  static async loadTimelineChats(projectId: string): Promise<any[]> {
    try {
      console.log('Loading timeline chats for project:', projectId);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          project_id,
          chapter_id,
          chat_type,
          position,
          selected_text,
          text_position,
          line_number,
          status,
          created_at
        `)
        .eq('project_id', projectId)
        .in('chat_type', ['comment', 'chat']) // Only load comment and chat types
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading timeline chats:', error);
        throw error;
      }

      console.log('Loaded timeline chats:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Failed to load timeline chats:', error);
      throw error;
    }
  }
}
