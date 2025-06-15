
import { supabase } from '@/integrations/supabase/client';

export interface ChapterContext {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export class ChapterContextService {
  static async getProjectChapters(projectId: string): Promise<ChapterContext[]> {
    try {
      console.log('Loading chapters context for project:', projectId);
      
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, content, word_count')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) {
        console.error('Error loading chapters context:', error);
        throw error;
      }

      const chapters: ChapterContext[] = (data || []).map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        content: chapter.content || '',
        wordCount: chapter.word_count || 0
      }));

      console.log('Loaded chapters context:', chapters.length);
      return chapters;
    } catch (error) {
      console.error('Failed to load chapters context:', error);
      return [];
    }
  }

  static formatChaptersForAI(chapters: ChapterContext[]): string {
    if (!chapters.length) {
      return 'No chapters available in this project.';
    }

    return chapters.map(chapter => {
      const contentPreview = chapter.content.length > 1000 
        ? chapter.content.substring(0, 1000) + '...'
        : chapter.content;
      
      return `=== Chapter: ${chapter.title} ===
Word Count: ${chapter.wordCount}
Content: ${contentPreview}

`;
    }).join('\n');
  }

  static getContextSummary(chapters: ChapterContext[]): string {
    const totalWords = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
    const chapterTitles = chapters.map(c => c.title).join(', ');
    
    return `Project contains ${chapters.length} chapters (${totalWords} total words): ${chapterTitles}`;
  }
}
