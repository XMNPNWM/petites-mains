import { SmartAnalysisOrchestrator } from './SmartAnalysisOrchestrator';
import { ConservativeDeduplicationService } from './ConservativeDeduplicationService';
import { ContentHashService } from './ContentHashService';
import { supabase } from '@/integrations/supabase/client';

interface GapAwareAnalysisResult {
  success: boolean;
  totalExtracted?: number;
  gapsDetected?: {
    relationships: boolean;
    timelineEvents: boolean;
    plotThreads: boolean;
    chapterSummaries: boolean;
  };
  processingStats?: {
    chunksProcessed: number;
    gapAnalysisApplied: boolean;
    conservativeDeduplicationApplied: boolean;
    itemsExtracted: number;
    itemsMerged: number;
  };
  error?: string;
}

/**
 * Phase 1: Gap-Aware Analysis Logic
 * Implements the Conservative Data Deduplication with Gap-Filling Strategy
 */
export class GapAwareAnalysisOrchestrator extends SmartAnalysisOrchestrator {
  
  /**
   * Gap-aware project analysis that overrides anti-overanalyze guardrails when needed
   */
  static async analyzeProject(projectId: string, options: { forceReExtraction?: boolean } = {}): Promise<GapAwareAnalysisResult> {
    const { forceReExtraction = false } = options;
    
    try {
      console.log('🚀 Starting gap-aware project analysis for:', projectId);
      
      // Phase 1: Check for category gaps FIRST
      const gapsDetected = await this.checkCategoryGaps(projectId);
      console.log('🔍 Gap analysis result:', gapsDetected);
      
      const processingStats = {
        chunksProcessed: 0,
        gapAnalysisApplied: Object.values(gapsDetected).some(gap => gap),
        conservativeDeduplicationApplied: false,
        itemsExtracted: 0,
        itemsMerged: 0
      };
      
      // Get all chapters in the project
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, title, content, updated_at')
        .eq('project_id', projectId)
        .order('order_index');
      
      if (chaptersError) {
        throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
      }
      
      if (!chapters || chapters.length === 0) {
        return {
          success: true,
          totalExtracted: 0,
          gapsDetected,
          processingStats
        };
      }
      
      let totalExtracted = 0;
      const hasAnyGaps = Object.values(gapsDetected).some(gap => gap);
      
      for (const chapter of chapters) {
        if (!chapter.content || chapter.content.trim().length === 0) {
          console.log(`⏭️ Skipping empty chapter: ${chapter.title}`);
          continue;
        }
        
        console.log(`📖 Processing chapter: ${chapter.title}`);
        
        // Step 1: Check if we should skip processing based on gaps and guardrails
        const shouldProcess = await this.shouldProcessChapter(
          chapter,
          projectId,
          hasAnyGaps,
          gapsDetected,
          forceReExtraction
        );
        
        if (!shouldProcess.process) {
          console.log(`⏭️ Skipping chapter ${chapter.title}: ${shouldProcess.reason}`);
          continue;
        }
        
        console.log(`🤖 Processing chapter ${chapter.title}: ${shouldProcess.reason}`);
        
        // Step 2: Extract knowledge with gap-aware focus
        const extractionResult = await this.performGapAwareExtraction(
          projectId,
          chapter,
          gapsDetected,
          forceReExtraction
        );
        
        if (extractionResult.success) {
          totalExtracted += extractionResult.itemsExtracted || 0;
          processingStats.itemsExtracted += extractionResult.itemsExtracted || 0;
          
          // Step 3: Apply conservative deduplication
          const deduplicationResult = await ConservativeDeduplicationService.processNewExtractions(
            projectId,
            extractionResult.extractedData || {}
          );
          
          processingStats.itemsMerged += deduplicationResult.itemsMerged;
          processingStats.conservativeDeduplicationApplied = true;
        }
        
        // Update content hash to mark as processed
        await ContentHashService.updateContentHash(chapter.id, chapter.content);
      }
      
      console.log('✅ Gap-aware project analysis complete');
      
      return {
        success: true,
        totalExtracted,
        gapsDetected,
        processingStats
      };
    } catch (error) {
      console.error('❌ Gap-aware project analysis failed:', error);
      return {
        success: false,
        error: error.message,
        gapsDetected: {
          relationships: false,
          timelineEvents: false,
          plotThreads: false,
          chapterSummaries: false
        }
      };
    }
  }
  
  /**
   * Check for empty categories that need gap-filling
   */
  private static async checkCategoryGaps(projectId: string): Promise<{
    relationships: boolean;
    timelineEvents: boolean;
    plotThreads: boolean;
    chapterSummaries: boolean;
  }> {
    try {
      // Check relationships count
      const { count: relationshipsCount } = await supabase
        .from('character_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      // Check timeline events count
      const { count: timelineEventsCount } = await supabase
        .from('timeline_events')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      // Check plot threads count
      const { count: plotThreadsCount } = await supabase
        .from('plot_threads')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      // Check chapter summaries count
      const { count: chapterSummariesCount } = await supabase
        .from('chapter_summaries')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      const gaps = {
        relationships: (relationshipsCount || 0) === 0,
        timelineEvents: (timelineEventsCount || 0) === 0,
        plotThreads: (plotThreadsCount || 0) === 0,
        chapterSummaries: (chapterSummariesCount || 0) === 0
      };
      
      console.log('📊 Category counts:', {
        relationships: relationshipsCount || 0,
        timelineEvents: timelineEventsCount || 0,
        plotThreads: plotThreadsCount || 0,
        chapterSummaries: chapterSummariesCount || 0
      });
      
      return gaps;
    } catch (error) {
      console.error('Error checking category gaps:', error);
      return {
        relationships: false,
        timelineEvents: false,
        plotThreads: false,
        chapterSummaries: false
      };
    }
  }
  
  /**
   * Determine if a chapter should be processed based on gaps and guardrails
   */
  private static async shouldProcessChapter(
    chapter: any,
    projectId: string,
    hasAnyGaps: boolean,
    gapsDetected: any,
    forceReExtraction: boolean
  ): Promise<{ process: boolean; reason: string }> {
    
    // Critical Anti-Overanalyze Override: If we have gaps, ALWAYS process for those categories
    if (hasAnyGaps) {
      return {
        process: true,
        reason: `Gap-filling mode: Empty categories detected (${Object.entries(gapsDetected).filter(([_, hasGap]) => hasGap).map(([category]) => category).join(', ')})`
      };
    }
    
    // Force re-extraction always processes
    if (forceReExtraction) {
      return {
        process: true,
        reason: 'Force re-extraction requested'
      };
    }
    
    // Normal guardrails apply only when NO gaps exist
    
    // Check content hash change
    const hashChanged = await this.checkContentHashChanged(chapter.id, chapter.content);
    if (!hashChanged) {
      return {
        process: false,
        reason: 'Content hash unchanged and no gaps detected'
      };
    }
    
    // Check embeddings similarity (placeholder for existing logic)
    // This would integrate with the existing similarity checking
    const hasSimilarContent = false; // Placeholder
    
    if (hasSimilarContent) {
      return {
        process: false,
        reason: 'High content similarity and no gaps detected'
      };
    }
    
    return {
      process: true,
      reason: 'Content changed and normal processing criteria met'
    };
  }
  
  /**
   * Perform gap-aware extraction focusing on empty categories
   */
  private static async performGapAwareExtraction(
    projectId: string,
    chapter: any,
    gapsDetected: any,
    forceReExtraction: boolean
  ): Promise<{
    success: boolean;
    itemsExtracted?: number;
    extractedData?: any;
  }> {
    try {
      // Determine which content types to extract based on gaps
      const contentTypesToExtract: string[] = [];
      
      if (gapsDetected.relationships) {
        contentTypesToExtract.push('characters', 'relationships');
      }
      if (gapsDetected.timelineEvents) {
        contentTypesToExtract.push('timeline_events');
      }
      if (gapsDetected.plotThreads) {
        contentTypesToExtract.push('plot_threads', 'plot_points');
      }
      if (gapsDetected.chapterSummaries) {
        contentTypesToExtract.push('chapter_summaries');
      }
      
      // If no gaps, extract all types (normal analysis)
      if (contentTypesToExtract.length === 0) {
        console.log('🔄 No gaps detected, performing normal extraction');
      } else {
        console.log(`🎯 Gap-filling extraction for: ${contentTypesToExtract.join(', ')}`);
      }
      
      // Call the extract-knowledge edge function with gap-aware configuration
      const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
        body: { 
          content: chapter.content,
          projectId: projectId,
          chapterId: chapter.id,
          options: {
            forceReExtraction: true, // Always extract when gaps are detected
            contentTypesToExtract: contentTypesToExtract.length > 0 ? contentTypesToExtract : undefined,
            useEmbeddingsBasedProcessing: contentTypesToExtract.length === 0 // Only use similarity checks when no gaps
          }
        }
      });

      if (knowledgeError) {
        console.error('❌ Gap-aware knowledge extraction failed:', knowledgeError);
        return { success: false };
      }

      if (knowledgeResult?.success && knowledgeResult.extractedData) {
        // Store the extracted knowledge
        const storedItems = await SmartAnalysisOrchestrator.storeComprehensiveKnowledge(
          projectId, 
          knowledgeResult.extractedData, 
          [chapter], 
          true
        );
        
        return {
          success: true,
          itemsExtracted: storedItems,
          extractedData: knowledgeResult.extractedData
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error in gap-aware extraction:', error);
      return { success: false };
    }
  }
  
  /**
   * Check if content hash has changed since last processing
   */
  private static async checkContentHashChanged(chapterId: string, content: string): Promise<boolean> {
    try {
      const { data: hashData } = await supabase
        .from('content_hashes')
        .select('original_content_hash')
        .eq('chapter_id', chapterId)
        .single();
      
      if (!hashData) {
        return true; // No hash exists, treat as changed
      }
      
      const currentHash = await ContentHashService.generateContentHash(content);
      return hashData.original_content_hash !== currentHash;
    } catch (error) {
      console.error('Error checking content hash:', error);
      return true; // Assume changed on error
    }
  }
}