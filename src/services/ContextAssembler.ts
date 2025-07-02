
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisContext {
  existingCharacters: Array<{
    name: string;
    description?: string;
    traits: string[];
    lastSeen: string;
  }>;
  plotThreads: Array<{
    name: string;
    status: string;
    keyEvents: string[];
  }>;
  userOverrides: Array<{
    field: string;
    originalValue: any;
    userValue: any;
    reason?: string;
  }>;
  previousAnalysisConfidence: number;
  chapterContext: {
    previousChapter?: string;
    nextChapter?: string;
    chapterNumber: number;
  };
}

export class ContextAssembler {
  /**
   * Assemble smart context for AI analysis
   */
  async assembleContext(projectId: string, chapterId?: string): Promise<AnalysisContext> {
    console.log(`🔍 Assembling context for project: ${projectId}, chapter: ${chapterId}`);

    const [
      existingCharacters,
      plotThreads,
      userOverrides,
      chapterContext
    ] = await Promise.all([
      this.getExistingCharacters(projectId),
      this.getPlotThreads(projectId),
      this.getUserOverrides(projectId),
      this.getChapterContext(chapterId)
    ]);

    // Calculate average confidence from previous analyses
    const { data: prevAnalyses } = await supabase
      .from('knowledge_base')
      .select('confidence_score')
      .eq('project_id', projectId);

    const previousAnalysisConfidence = prevAnalyses && prevAnalyses.length > 0
      ? prevAnalyses.reduce((sum, item) => sum + item.confidence_score, 0) / prevAnalyses.length
      : 0.5;

    return {
      existingCharacters,
      plotThreads,
      userOverrides,
      previousAnalysisConfidence,
      chapterContext
    };
  }

  private async getExistingCharacters(projectId: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('name, description, details, last_seen_at')
      .eq('project_id', projectId)
      .eq('category', 'character')
      .order('confidence_score', { ascending: false });

    if (error) {
      console.warn('Failed to fetch existing characters:', error);
      return [];
    }

    return (data || []).map(char => ({
      name: char.name,
      description: char.description,
      traits: char.details?.traits || [],
      lastSeen: char.last_seen_at
    }));
  }

  private async getPlotThreads(projectId: string) {
    const { data, error } = await supabase
      .from('plot_threads')
      .select('thread_name, thread_status, key_events')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch plot threads:', error);
      return [];
    }

    return (data || []).map(thread => ({
      name: thread.thread_name,
      status: thread.thread_status || 'active',
      keyEvents: Array.isArray(thread.key_events) ? thread.key_events : []
    }));
  }

  private async getUserOverrides(projectId: string) {
    // Get user overrides from analysis results
    const { data, error } = await supabase
      .from('user_overrides')
      .select(`
        field_path,
        original_ai_value,
        user_value,
        override_reason,
        analysis_results!inner(content_id)
      `)
      .eq('analysis_results.content_type', 'chapter');

    if (error) {
      console.warn('Failed to fetch user overrides:', error);
      return [];
    }

    return (data || []).map(override => ({
      field: override.field_path,
      originalValue: override.original_ai_value,
      userValue: override.user_value,
      reason: override.override_reason
    }));
  }

  private async getChapterContext(chapterId?: string) {
    if (!chapterId) {
      return {
        chapterNumber: 1
      };
    }

    const { data: chapter } = await supabase
      .from('chapters')
      .select('title, order_index, project_id')
      .eq('id', chapterId)
      .single();

    if (!chapter) {
      return { chapterNumber: 1 };
    }

    // Get previous and next chapters
    const { data: adjacentChapters } = await supabase
      .from('chapters')
      .select('title, order_index')
      .eq('project_id', chapter.project_id)
      .in('order_index', [chapter.order_index - 1, chapter.order_index + 1]);

    const previousChapter = adjacentChapters?.find(c => c.order_index === chapter.order_index - 1);
    const nextChapter = adjacentChapters?.find(c => c.order_index === chapter.order_index + 1);

    return {
      previousChapter: previousChapter?.title,
      nextChapter: nextChapter?.title,
      chapterNumber: chapter.order_index + 1
    };
  }
}
