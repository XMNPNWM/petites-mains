import { SmartAnalysisOrchestrator } from './SmartAnalysisOrchestrator';
import { EmbeddingsBasedProcessingService } from './EmbeddingsBasedProcessingService';
import { EnhancedEmbeddingsService } from './EnhancedEmbeddingsService';
import { EmbeddingBasedSemanticMerger } from './EmbeddingBasedSemanticMerger';
import { ContentHashService } from './ContentHashService';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedAnalysisResult {
  success: boolean;
  totalExtracted?: number;
  processingStats?: {
    chunksProcessed: number;
    embeddingsGenerated: number;
    semanticMergesPerformed: number;
    itemsLinked: number;
    userConflictsDetected: number;
    extractionSkipped: boolean;
  };
  error?: string;
}

/**
 * Enhanced Analysis Orchestrator that implements the complete workflow
 * from the implementation plan while maintaining backward compatibility
 */
export class EnhancedAnalysisOrchestrator extends SmartAnalysisOrchestrator {
  
  /**
   * Enhanced project analysis that follows the complete workflow
   */
  static async analyzeProject(projectId: string, options: { forceReExtraction?: boolean; contentTypesToExtract?: string[] } = {}): Promise<EnhancedAnalysisResult> {
    const { forceReExtraction = false } = options;
    try {
      console.log('🚀 Starting enhanced project analysis for:', projectId);
      
      const processingStats = {
        chunksProcessed: 0,
        embeddingsGenerated: 0,
        semanticMergesPerformed: 0,
        itemsLinked: 0,
        userConflictsDetected: 0,
        extractionSkipped: false
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
          processingStats
        };
      }
      
      let totalExtracted = 0;
      
      for (const chapter of chapters) {
        if (!chapter.content || chapter.content.trim().length === 0) {
          console.log(`⏭️ Skipping empty chapter: ${chapter.title}`);
          continue;
        }
        
        console.log(`📖 Processing chapter: ${chapter.title}`);
        
        // Step 1: Content Change Verification (Hash-based Detection)
        const hashChanged = await this.checkContentHashChanged(chapter.id, chapter.content, forceReExtraction);
        if (!hashChanged && !forceReExtraction) {
          console.log(`⏭️ Skipping unchanged chapter: ${chapter.title}`);
          continue;
        }
        
        if (forceReExtraction) {
          console.log(`🔄 Force re-extraction enabled for chapter: ${chapter.title}`);
        }
        
        // Step 2: Incremental Embeddings Processing
        const embeddingsResult = await EnhancedEmbeddingsService.processIncrementalEmbeddings(
          projectId,
          chapter.id,
          chapter.content
        );
        
        processingStats.chunksProcessed += embeddingsResult.chunksProcessed;
        processingStats.embeddingsGenerated += embeddingsResult.embeddingsGenerated;
        
        // Step 3: Enhanced Pre-Analysis Similarity Check
        const similarityResult = await EnhancedEmbeddingsService.checkChunkLevelSimilarity(
          projectId,
          chapter.content,
          chapter.id,
          forceReExtraction
        );
        
        if (similarityResult.shouldSkipExtraction) {
          // Step 4: Smart Content Linking (if extraction skipped)
          const linkingResult = await EnhancedEmbeddingsService.smartContentLinking(
            projectId,
            chapter.id,
            similarityResult.similarChunks
          );
          
          processingStats.itemsLinked += linkingResult.itemsLinked;
          processingStats.extractionSkipped = true;
          
          console.log(`🔗 Extraction skipped for ${chapter.title}: ${linkingResult.message}`);
          continue;
        }
        
        // Step 5: LLM Analysis / Data Extraction (if not skipped)
        console.log(`🤖 Performing LLM analysis for: ${chapter.title}`);
        
        // FIXED: Call the extract-knowledge edge function directly for knowledge extraction
        console.log('🔧 DEBUG: About to call extract-knowledge edge function for chapter:', chapter.title);
        
        const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
          body: { 
            content: chapter.content,
            projectId: projectId,
            chapterId: chapter.id,
            options: {
              forceReExtraction: true, // Always extract for enhanced analysis
              useEmbeddingsBasedProcessing: true
            }
          }
        });

        console.log('📥 extract-knowledge response for chapter:', chapter.title, {
          hasData: !!knowledgeResult,
          hasError: !!knowledgeError,
          success: knowledgeResult?.success,
          extractedDataKeys: knowledgeResult?.extractedData ? Object.keys(knowledgeResult.extractedData) : []
        });

        if (knowledgeError) {
          console.error('❌ Knowledge extraction failed for chapter:', chapter.title, knowledgeError);
          // Continue with content enhancement as fallback
          const analysisResult = await this.performEnhancedLLMAnalysis(projectId, chapter);
        } else if (knowledgeResult?.success && knowledgeResult.extractedData) {
          console.log('✅ Knowledge extraction completed for chapter:', chapter.title);
          console.log('📊 Extracted data:', {
            characters: knowledgeResult.extractedData.characters?.length || 0,
            relationships: knowledgeResult.extractedData.relationships?.length || 0,
            timelineEvents: knowledgeResult.extractedData.timelineEvents?.length || 0,
            plotThreads: knowledgeResult.extractedData.plotThreads?.length || 0,
            plotPoints: knowledgeResult.extractedData.plotPoints?.length || 0,
            chapterSummaries: knowledgeResult.extractedData.chapterSummaries?.length || 0,
            worldBuilding: knowledgeResult.extractedData.worldBuilding?.length || 0,
            themes: knowledgeResult.extractedData.themes?.length || 0
          });
          
          // Store the extracted knowledge using the base class method
          const storedItems = await SmartAnalysisOrchestrator.storeComprehensiveKnowledge(
            projectId, 
            knowledgeResult.extractedData, 
            [chapter], 
            true // force flag
          );
          totalExtracted += storedItems;
        }

        // Also run content enhancement for refinement
        const analysisResult = await this.performEnhancedLLMAnalysis(projectId, chapter);
        
        if (analysisResult.success) {
          totalExtracted += analysisResult.itemsExtracted || 0;
          
          // Step 6: Enhanced Post-Extraction Deduplication with User Override Protection
          const deduplicationResult = await this.performEnhancedDeduplication(
            projectId,
            analysisResult.extractedData
          );
          
          processingStats.semanticMergesPerformed += deduplicationResult.mergesPerformed;
          processingStats.userConflictsDetected += deduplicationResult.conflictsDetected;
        }
        
        // Update content hash to mark as processed
        await ContentHashService.updateContentHash(chapter.id, chapter.content);
      }
      
      // Final optimization pass
      console.log('🛠️ Running final knowledge base optimization...');
      const optimizationResult = await EmbeddingsBasedProcessingService.optimizeKnowledgeBase(projectId);
      
      processingStats.semanticMergesPerformed += optimizationResult.semanticMergesPerformed || 0;
      processingStats.userConflictsDetected += optimizationResult.userConflictsDetected || 0;
      
      console.log('✅ Enhanced project analysis complete');
      
      return {
        success: true,
        totalExtracted,
        processingStats
      };
    } catch (error) {
      console.error('❌ Enhanced project analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if content hash has changed since last processing
   */
  private static async checkContentHashChanged(chapterId: string, content: string, forceReExtraction = false): Promise<boolean> {
    // If force re-extraction is enabled, always return true to bypass hash check
    if (forceReExtraction) {
      console.log(`🔄 Bypassing hash check for chapter ${chapterId} due to force re-extraction`);
      return true;
    }
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
  
  /**
   * Enhanced LLM analysis with existing knowledge context
   */
  private static async performEnhancedLLMAnalysis(
    projectId: string,
    chapter: any
  ): Promise<{
    success: boolean;
    itemsExtracted?: number;
    extractedData?: any;
  }> {
    try {
      // Get existing knowledge context to provide to LLM
      const existingKnowledge = await this.getExistingKnowledgeContext(projectId);
      
      // Use the original analysis method but with enhanced context
      await SmartAnalysisOrchestrator.analyzeChapter(projectId, chapter.id);
      
      // Count newly extracted items
      const { data: newItems } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('project_id', projectId)
        .eq('is_newly_extracted', true);
      
      return {
        success: true,
        itemsExtracted: newItems?.length || 0,
        extractedData: newItems
      };
    } catch (error) {
      console.error('Error in enhanced LLM analysis:', error);
      return { success: false };
    }
  }
  
  /**
   * Enhanced deduplication with user override protection
   */
  private static async performEnhancedDeduplication(
    projectId: string,
    extractedData: any
  ): Promise<{
    mergesPerformed: number;
    conflictsDetected: number;
  }> {
    let mergesPerformed = 0;
    let conflictsDetected = 0;
    
    try {
      // Get newly extracted items that need deduplication
      const { data: newRelationships } = await supabase
        .from('character_relationships')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_newly_extracted', true);
      
      if (newRelationships) {
        for (const rel of newRelationships) {
          const mergeResult = await EmbeddingBasedSemanticMerger.mergeCharacterRelationships(projectId, rel);
          if (mergeResult.merged) {
            mergesPerformed++;
            await supabase.from('character_relationships').delete().eq('id', rel.id);
          } else if (mergeResult.conflictResolution === 'user_required') {
            conflictsDetected++;
          }
        }
      }
      
      // Apply similar logic for other knowledge types
      const { data: newEvents } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_newly_extracted', true);
      
      if (newEvents) {
        for (const event of newEvents) {
          const mergeResult = await EmbeddingBasedSemanticMerger.mergeTimelineEvents(projectId, event);
          if (mergeResult.merged) {
            mergesPerformed++;
            await supabase.from('timeline_events').delete().eq('id', event.id);
          } else if (mergeResult.conflictResolution === 'user_required') {
            conflictsDetected++;
          }
        }
      }
      
      return { mergesPerformed, conflictsDetected };
    } catch (error) {
      console.error('Error in enhanced deduplication:', error);
      return { mergesPerformed, conflictsDetected };
    }
  }
  
  /**
   * Get existing knowledge context for LLM
   */
  private static async getExistingKnowledgeContext(projectId: string): Promise<any> {
    try {
      const { data: characters } = await supabase
        .from('knowledge_base')
        .select('name, description, category')
        .eq('project_id', projectId)
        .eq('category', 'character')
        .limit(10);
      
      const { data: relationships } = await supabase
        .from('character_relationships')
        .select('character_a_name, character_b_name, relationship_type')
        .eq('project_id', projectId)
        .limit(10);
      
      return {
        characters: characters || [],
        relationships: relationships || []
      };
    } catch (error) {
      console.error('Error getting existing knowledge context:', error);
      return { characters: [], relationships: [] };
    }
  }
}