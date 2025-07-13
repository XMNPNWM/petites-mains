import { supabase } from '@/integrations/supabase/client';

interface GapDetectionResult {
  relationships: boolean;
  timelineEvents: boolean;
  plotThreads: boolean;
  chapterSummaries: boolean;
  worldBuilding: boolean;
  themes: boolean;
}

interface GapAnalysisResult {
  success: boolean;
  totalExtracted: number;
  gapsDetected: GapDetectionResult;
  gapsFilled: string[];
  error?: string;
}

/**
 * Independent Gap-Only Analysis Service
 * Operates separately from main analysis pipeline to surgically fill empty categories
 */
export class GapOnlyAnalysisService {
  
  /**
   * Phase 1: Lightweight gap detection across entire project
   */
  static async detectEmptyCategories(projectId: string): Promise<GapDetectionResult> {
    console.log('🔍 Detecting empty categories for project:', projectId);
    
    try {
      const [
        relationshipsCount,
        timelineEventsCount,
        plotThreadsCount,
        chapterSummariesCount,
        worldBuildingCount,
        themesCount
      ] = await Promise.all([
        supabase.from('character_relationships').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('timeline_events').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('plot_threads').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('chapter_summaries').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'world_building'),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('category', 'theme')
      ]);

      const gaps = {
        relationships: (relationshipsCount.count || 0) === 0,
        timelineEvents: (timelineEventsCount.count || 0) === 0,
        plotThreads: (plotThreadsCount.count || 0) === 0,
        chapterSummaries: (chapterSummariesCount.count || 0) === 0,
        worldBuilding: (worldBuildingCount.count || 0) === 0,
        themes: (themesCount.count || 0) === 0
      };

      console.log('📊 Gap detection results:', gaps);
      return gaps;
    } catch (error) {
      console.error('❌ Error detecting gaps:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Focused extraction for empty categories only
   */
  static async fillCategoryGaps(projectId: string, gaps: GapDetectionResult): Promise<GapAnalysisResult> {
    console.log('🎯 Starting gap-only extraction for project:', projectId);
    
    try {
      // Get all chapters with content
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, content')
        .eq('project_id', projectId)
        .not('content', 'is', null)
        .neq('content', '');

      if (chaptersError) {
        throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
      }

      if (!chapters || chapters.length === 0) {
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected: gaps,
          gapsFilled: []
        };
      }

      // Identify which categories need extraction
      const emptyCategories = Object.entries(gaps)
        .filter(([_, isEmpty]) => isEmpty)
        .map(([category, _]) => category);

      if (emptyCategories.length === 0) {
        console.log('✅ No gaps detected, skipping extraction');
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected: gaps,
          gapsFilled: []
        };
      }

      console.log('🎯 Extracting data for empty categories:', emptyCategories);

      let totalExtracted = 0;
      const gapsFilled: string[] = [];

      // Process chapters sequentially to avoid overwhelming the edge function
      for (const chapter of chapters) {
        console.log(`📖 Processing chapter for gaps: ${chapter.title}`);
        
        const extractionResult = await this.extractForEmptyCategories(
          chapter,
          projectId,
          emptyCategories
        );

        if (extractionResult.success) {
          totalExtracted += extractionResult.extractedCount;
          extractionResult.categoriesFilled.forEach(category => {
            if (!gapsFilled.includes(category)) {
              gapsFilled.push(category);
            }
          });
        }
      }

      console.log(`✅ Gap extraction complete. Total extracted: ${totalExtracted}, Categories filled: ${gapsFilled}`);

      return {
        success: true,
        totalExtracted,
        gapsDetected: gaps,
        gapsFilled
      };

    } catch (error) {
      console.error('❌ Gap extraction failed:', error);
      return {
        success: false,
        totalExtracted: 0,
        gapsDetected: gaps,
        gapsFilled: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract data only for specified empty categories
   */
  private static async extractForEmptyCategories(
    chapter: { id: string; title: string; content: string },
    projectId: string,
    emptyCategories: string[]
  ): Promise<{ success: boolean; extractedCount: number; categoriesFilled: string[] }> {
    
    try {
      // Create focused extraction request for only empty categories
      const extractionTypes = emptyCategories.map(category => {
        switch (category) {
          case 'relationships': return 'character_relationships';
          case 'timelineEvents': return 'timeline_events';
          case 'plotThreads': return 'plot_threads';
          case 'chapterSummaries': return 'chapter_summaries';
          case 'worldBuilding': return 'world_building';
          case 'themes': return 'themes';
          default: return category;
        }
      });

      console.log(`🤖 Calling edge function for chapter ${chapter.title}, categories: ${extractionTypes}`);

      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: chapter.id,
          content: chapter.content,
          mode: 'gap_fill_only',
          targetCategories: extractionTypes
        }
      });

      if (error) {
        console.error(`❌ Edge function error for chapter ${chapter.title}:`, error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      if (!result || !result.success) {
        console.error(`❌ Extraction failed for chapter ${chapter.title}:`, result?.error);
        return { success: false, extractedCount: 0, categoriesFilled: [] };
      }

      console.log(`✅ Extracted ${result.totalExtracted || 0} items from chapter ${chapter.title}`);

      return {
        success: true,
        extractedCount: result.totalExtracted || 0,
        categoriesFilled: extractionTypes
      };

    } catch (error) {
      console.error(`❌ Error processing chapter ${chapter.title}:`, error);
      return { success: false, extractedCount: 0, categoriesFilled: [] };
    }
  }

  /**
   * Main entry point for gap-only analysis
   */
  static async executeGapAnalysis(projectId: string): Promise<GapAnalysisResult> {
    console.log('🚀 Starting gap-only analysis for project:', projectId);

    // Phase 1: Detect gaps
    const gaps = await this.detectEmptyCategories(projectId);
    
    // Phase 2: Fill gaps if any exist
    return await this.fillCategoryGaps(projectId, gaps);
  }
}