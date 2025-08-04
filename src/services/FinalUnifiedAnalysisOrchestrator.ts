import { supabase } from '@/integrations/supabase/client';
import { ContentHashService } from './ContentHashService';
import { KnowledgeSynthesisService } from './KnowledgeSynthesisService';
import { GapOnlyAnalysisService } from './GapOnlyAnalysisService';

interface UnifiedAnalysisResult {
  success: boolean;
  totalExtracted: number;
  processingStats: {
    chaptersProcessed: number;
    gapsDetected: string[];
    gapsFilled: string[];
    synthesisTriggered: boolean;
  };
  error?: string;
}

/**
 * Final Unified Analysis Orchestrator
 * Replaces all previous orchestrators with a single, clear pipeline
 */
export class FinalUnifiedAnalysisOrchestrator {
  
  /**
   * Main analysis entry point - handles all scenarios
   */
  static async analyzeProject(
    projectId: string, 
    options: { 
      forceReExtraction?: boolean; 
      selectedContentTypes?: string[] 
    } = {}
  ): Promise<UnifiedAnalysisResult> {
    try {
      const { forceReExtraction = false, selectedContentTypes = [] } = options;
      console.log('🚀 [UNIFIED] Starting final unified analysis:', projectId, { forceReExtraction, selectedContentTypes });

      const processingStats = {
        chaptersProcessed: 0,
        gapsDetected: [],
        gapsFilled: [],
        synthesisTriggered: false
      };

      // Step 1: Gap Detection - determine what's missing
      const gaps = await GapOnlyAnalysisService.detectEmptyCategories(projectId);
      const emptyCategories = Object.entries(gaps)
        .filter(([_, isEmpty]) => isEmpty)
        .map(([category]) => category);
      
      processingStats.gapsDetected = emptyCategories;
      console.log('🔍 [UNIFIED] Gaps detected:', emptyCategories);

      let totalExtracted = 0;

      if (emptyCategories.length > 0) {
        // Step 2a: Gap Analysis - fill empty categories with cross-chapter context
        console.log('🎯 [UNIFIED] Running gap analysis for empty categories');
        const gapResult = await this.performGapAnalysisWithContext(projectId, gaps);
        
        if (gapResult.success) {
          totalExtracted += gapResult.totalExtracted;
          processingStats.gapsFilled = gapResult.gapsFilled;
        }
      } else {
        // Step 2b: Standard Analysis - process changed chapters only
        console.log('🔄 [UNIFIED] Running standard analysis for changed content');
        const standardResult = await this.performStandardAnalysis(projectId, forceReExtraction, selectedContentTypes);
        
        if (standardResult.success) {
          totalExtracted += standardResult.totalExtracted;
          processingStats.chaptersProcessed = standardResult.chaptersProcessed;
        }
      }

      // Step 3: Always trigger synthesis after any analysis
      if (totalExtracted > 0) {
        console.log('🧩 [UNIFIED] Triggering synthesis');
        try {
          await KnowledgeSynthesisService.synthesizeAllEntities(projectId);
          processingStats.synthesisTriggered = true;
        } catch (synthesisError) {
          console.warn('⚠️ [UNIFIED] Synthesis failed but analysis succeeded:', synthesisError);
        }
      }

      console.log('✅ [UNIFIED] Analysis complete:', { totalExtracted, processingStats });
      
      return {
        success: true,
        totalExtracted,
        processingStats
      };

    } catch (error) {
      console.error('❌ [UNIFIED] Analysis failed:', error);
      return {
        success: false,
        totalExtracted: 0,
        processingStats: {
          chaptersProcessed: 0,
          gapsDetected: [],
          gapsFilled: [],
          synthesisTriggered: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gap analysis with proper cross-chapter context for relationships, themes, world-building
   */
  private static async performGapAnalysisWithContext(
    projectId: string, 
    gaps: any
  ): Promise<{ success: boolean; totalExtracted: number; gapsFilled: string[] }> {
    
    try {
      console.log('🎯 [UNIFIED] Performing gap analysis with cross-chapter context');
      
      // Get ALL chapters for cross-chapter context (critical for relationships, themes, world-building)
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, content')
        .eq('project_id', projectId)
        .not('content', 'is', null)
        .neq('content', '');

      if (chaptersError || !chapters?.length) {
        console.log('⚠️ [UNIFIED] No chapters found for gap analysis');
        return { success: true, totalExtracted: 0, gapsFilled: [] };
      }

      // Create aggregated content for context-dependent categories
      const aggregatedContent = chapters
        .map(ch => ch.content)
        .join('\n\n--- CHAPTER BREAK ---\n\n');

      const emptyCategories = Object.entries(gaps)
        .filter(([_, isEmpty]) => isEmpty)
        .map(([category]) => category);

      let totalExtracted = 0;
      const gapsFilled: string[] = [];

      // Process each empty category with appropriate context
      for (const category of emptyCategories) {
        const useAggregatedContent = ['relationships', 'themes', 'worldBuilding'].includes(category);
        
        if (useAggregatedContent) {
          // Use aggregated content for context-dependent categories
          console.log(`🔗 [UNIFIED] Extracting ${category} with cross-chapter context`);
          const result = await this.extractCategoryWithContext(
            projectId,
            category,
            aggregatedContent,
            chapters.map(ch => ch.id)
          );
          
          if (result.success) {
            totalExtracted += result.extracted;
            gapsFilled.push(category);
          }
        } else {
          // Use chapter-by-chapter for standalone categories
          console.log(`📖 [UNIFIED] Extracting ${category} chapter-by-chapter`);
          for (const chapter of chapters) {
            const result = await this.extractCategoryWithContext(
              projectId,
              category,
              chapter.content,
              [chapter.id]
            );
            
            if (result.success) {
              totalExtracted += result.extracted;
            }
          }
          
          if (totalExtracted > 0) {
            gapsFilled.push(category);
          }
        }
      }

      return { success: true, totalExtracted, gapsFilled };

    } catch (error) {
      console.error('❌ [UNIFIED] Gap analysis failed:', error);
      return { success: false, totalExtracted: 0, gapsFilled: [] };
    }
  }

  /**
   * Standard analysis for projects with existing data
   */
  private static async performStandardAnalysis(
    projectId: string,
    forceReExtraction: boolean,
    selectedContentTypes: string[]
  ): Promise<{ success: boolean; totalExtracted: number; chaptersProcessed: number }> {
    
    try {
      console.log('🔄 [UNIFIED] Performing standard analysis');
      
      // Get chapters that need processing based on content changes
      const chapters = await this.getChaptersForAnalysis(projectId, forceReExtraction);
      
      if (chapters.length === 0) {
        console.log('✅ [UNIFIED] No chapters need processing');
        return { success: true, totalExtracted: 0, chaptersProcessed: 0 };
      }

      let totalExtracted = 0;

      // Process each changed chapter individually
      for (const chapter of chapters) {
        console.log(`📖 [UNIFIED] Processing chapter: ${chapter.title}`);
        
        const result = await this.extractFromSingleChapter(
          projectId,
          chapter,
          selectedContentTypes,
          forceReExtraction
        );
        
        if (result.success) {
          totalExtracted += result.extracted;
        }

        // Update content hash to mark as processed
        await ContentHashService.updateContentHash(chapter.id, chapter.content);
      }

      return { success: true, totalExtracted, chaptersProcessed: chapters.length };

    } catch (error) {
      console.error('❌ [UNIFIED] Standard analysis failed:', error);
      return { success: false, totalExtracted: 0, chaptersProcessed: 0 };
    }
  }

  /**
   * Extract specific category with proper context
   */
  private static async extractCategoryWithContext(
    projectId: string,
    category: string,
    content: string,
    sourceChapterIds: string[]
  ): Promise<{ success: boolean; extracted: number }> {
    
    try {
      const edgeFunctionCategory = this.convertToEdgeFunctionFormat(category);
      
      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: sourceChapterIds[0], // Primary chapter ID
          content,
          mode: 'gap_fill_with_context',
          targetCategory: edgeFunctionCategory,
          sourceChapterIds // All source chapters for context
        }
      });

      if (error || !result?.success) {
        console.error(`❌ [UNIFIED] Category extraction failed for ${category}:`, error || result?.error);
        return { success: false, extracted: 0 };
      }

      const extractedData = result.extractedData?.[this.convertFromEdgeFunctionFormat(edgeFunctionCategory)] || [];
      
      if (extractedData.length > 0) {
        // Store the data with proper chapter context
        const stored = await this.storeExtractedData(
          { [this.convertFromEdgeFunctionFormat(edgeFunctionCategory)]: extractedData },
          projectId,
          sourceChapterIds
        );
        
        return { success: true, extracted: stored };
      }

      return { success: true, extracted: 0 };

    } catch (error) {
      console.error(`❌ [UNIFIED] Error extracting ${category}:`, error);
      return { success: false, extracted: 0 };
    }
  }

  /**
   * Extract from a single chapter with all categories
   */
  private static async extractFromSingleChapter(
    projectId: string,
    chapter: any,
    selectedContentTypes: string[],
    forceReExtraction: boolean
  ): Promise<{ success: boolean; extracted: number }> {
    
    try {
      const { data: result, error } = await supabase.functions.invoke('extract-knowledge', {
        body: {
          projectId,
          chapterId: chapter.id,
          content: chapter.content,
          options: {
            forceReExtraction,
            contentTypesToExtract: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
            useEmbeddingsBasedProcessing: true
          }
        }
      });

      if (error || !result?.success) {
        console.error(`❌ [UNIFIED] Chapter extraction failed for ${chapter.title}:`, error || result?.error);
        return { success: false, extracted: 0 };
      }

      if (result.extractedData) {
        const stored = await this.storeExtractedData(
          result.extractedData,
          projectId,
          [chapter.id]
        );
        
        return { success: true, extracted: stored };
      }

      return { success: true, extracted: 0 };

    } catch (error) {
      console.error(`❌ [UNIFIED] Error extracting from chapter ${chapter.title}:`, error);
      return { success: false, extracted: 0 };
    }
  }

  /**
   * Store extracted data in the database
   */
  private static async storeExtractedData(
    extractedData: any,
    projectId: string,
    sourceChapterIds: string[]
  ): Promise<number> {
    
    let totalStored = 0;

    try {
      // Store each category type
      const categories = [
        { key: 'characters', table: 'knowledge_base', category: 'character' },
        { key: 'themes', table: 'knowledge_base', category: 'theme' },
        { key: 'worldBuilding', table: 'knowledge_base', category: 'world_building' },
        { key: 'relationships', table: 'character_relationships' },
        { key: 'timelineEvents', table: 'timeline_events' },
        { key: 'plotThreads', table: 'plot_threads' },
        { key: 'plotPoints', table: 'plot_points' },
        { key: 'chapterSummaries', table: 'chapter_summaries' }
      ];

      for (const cat of categories) {
        const data = extractedData[cat.key];
        if (data && data.length > 0) {
          for (const item of data) {
            await this.storeIndividualItem(item, cat, projectId, sourceChapterIds);
            totalStored++;
          }
        }
      }

    } catch (error) {
      console.error('❌ [UNIFIED] Error storing extracted data:', error);
    }

    return totalStored;
  }

  /**
   * Store individual item based on its category
   */
  private static async storeIndividualItem(
    item: any,
    category: any,
    projectId: string,
    sourceChapterIds: string[]
  ) {
    
    if (category.table === 'knowledge_base') {
      const { error } = await supabase.from('knowledge_base').insert({
        project_id: projectId,
        name: item.name,
        category: category.category,
        subcategory: item.subcategory || item.role,
        description: item.description,
        details: item.details || { traits: item.traits || [] },
        confidence_score: item.confidence_score || 0.5,
        source_chapter_ids: sourceChapterIds,
        source_chapter_id: sourceChapterIds[0], // Primary source
        is_newly_extracted: true
      });
      
      if (error) console.error(`Error storing ${category.category}:`, error);
    } else {
      // Handle other table types (relationships, timeline events, etc.)
      const baseData = {
        project_id: projectId,
        source_chapter_ids: sourceChapterIds,
        source_chapter_id: sourceChapterIds[0],
        confidence_score: item.confidence_score || 0.5,
        is_newly_extracted: true
      };

      const { error } = await supabase.from(category.table).insert({
        ...baseData,
        ...item
      });
      
      if (error) console.error(`Error storing ${category.key}:`, error);
    }
  }

  /**
   * Get chapters that need analysis based on content changes
   */
  private static async getChaptersForAnalysis(projectId: string, forceReExtraction: boolean): Promise<any[]> {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error || !chapters?.length) {
      return [];
    }

    if (forceReExtraction) {
      return chapters.filter(c => c.content && c.content.trim().length > 0);
    }

    // Check content hashes to determine which chapters need analysis
    const chaptersNeedingAnalysis = [];
    for (const chapter of chapters) {
      if (chapter.content && chapter.content.trim().length > 0) {
        try {
          const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
          if (hashResult.hasChanges) {
            chaptersNeedingAnalysis.push(chapter);
          }
        } catch (hashError) {
          console.error(`Hash verification failed for chapter ${chapter.id}:`, hashError);
          chaptersNeedingAnalysis.push(chapter);
        }
      }
    }

    return chaptersNeedingAnalysis;
  }

  /**
   * Convert category names for edge function compatibility
   */
  private static convertToEdgeFunctionFormat(category: string): string {
    const mapping: Record<string, string> = {
      'relationships': 'character_relationships',
      'timelineEvents': 'timeline_events',
      'plotThreads': 'plot_threads',
      'chapterSummaries': 'chapter_summaries',
      'worldBuilding': 'world_building',
      'themes': 'themes',
      'characters': 'characters'
    };
    return mapping[category] || category;
  }

  /**
   * Convert edge function format back to internal format
   */
  private static convertFromEdgeFunctionFormat(category: string): string {
    const mapping: Record<string, string> = {
      'character_relationships': 'relationships',
      'timeline_events': 'timelineEvents',
      'plot_threads': 'plotThreads',
      'chapter_summaries': 'chapterSummaries',
      'world_building': 'worldBuilding',
      'themes': 'themes',
      'characters': 'characters'
    };
    return mapping[category] || category;
  }
}