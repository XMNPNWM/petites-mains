
import { supabase } from '@/integrations/supabase/client';
import { getWordCount } from '@/lib/contentUtils';
import { Chapter } from '@/types/shared';

export class ChapterService {
  static async fetchChapter(id: string): Promise<Chapter | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      return null;
    }
  }

  static async updateChapter(chapter: Chapter): Promise<void> {
    const wordCount = getWordCount(chapter.content);
    
    const { error } = await supabase
      .from('chapters')
      .update({ 
        content: chapter.content,
        word_count: wordCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', chapter.id);

    if (error) throw error;
  }

  static async fetchChaptersByProject(projectId: string): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }
}
