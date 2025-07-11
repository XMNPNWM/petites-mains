import { supabase } from '@/integrations/supabase/client';
import { EmbeddingsService } from './EmbeddingsService';
import { SemanticDeduplicationService } from './SemanticDeduplicationService';
import { EnhancedEmbeddingsService } from './EnhancedEmbeddingsService';
import { EmbeddingBasedSemanticMerger } from './EmbeddingBasedSemanticMerger';

interface ProcessingResult {
  shouldSkipExtraction: boolean;
  similarContent: boolean;
  reason: string;
  suggestions?: string[];
}

export class EmbeddingsBasedProcessingService {
  /**
   * Enhanced content processing check using the new enhanced embeddings service
   */
  static async checkContentProcessingNeed(
    projectId: string,
    content: string,
    chapterId?: string
  ): Promise<ProcessingResult> {
    try {
      console.log('🔍 Enhanced content processing check starting...');
      
      // Use enhanced chunk-level similarity check
      const enhancedResult = await EnhancedEmbeddingsService.checkChunkLevelSimilarity(
        projectId,
        content,
        chapterId
      );

      if (enhancedResult.shouldSkipExtraction) {
        console.log('⏭️ Skipping extraction - enhanced similarity check detected high similarity');
        
        // Perform smart content linking if skipping
        if (chapterId && enhancedResult.similarChunks.length > 0) {
          await EnhancedEmbeddingsService.smartContentLinking(
            projectId,
            chapterId,
            enhancedResult.similarChunks
          );
        }
        
        return {
          shouldSkipExtraction: true,
          similarContent: true,
          reason: enhancedResult.reasoning,
          suggestions: [
            'Content linked to existing knowledge items',
            'Confidence scores boosted for related items',
            'No duplicate extraction performed'
          ]
        };
      }

      if (enhancedResult.recommendedAction === 'proceed_with_enhanced_dedup') {
        console.log('🔄 Proceeding with enhanced semantic deduplication');
        return {
          shouldSkipExtraction: false,
          similarContent: true,
          reason: enhancedResult.reasoning,
          suggestions: [
            'Will use embedding-based semantic merging',
            'LLM conflict resolution when needed',
            'User overrides will be preserved'
          ]
        };
      }

      console.log('✅ Content is novel - proceeding with normal extraction');
      return {
        shouldSkipExtraction: false,
        similarContent: false,
        reason: enhancedResult.reasoning
      };
    } catch (error) {
      console.error('Error in enhanced content processing check:', error);
      return {
        shouldSkipExtraction: false,
        similarContent: false,
        reason: 'Error in enhanced similarity check - proceeding with extraction'
      };
    }
  }

  /**
   * Initialize embeddings for a project's existing chunks
   */
  static async initializeProjectEmbeddings(projectId: string): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    message: string;
  }> {
    try {
      console.log(`🚀 Initializing embeddings for project: ${projectId}`);
      
      const result = await EmbeddingsService.processProjectEmbeddings(projectId);
      
      return {
        success: true,
        processed: result.processed,
        errors: result.errors,
        message: `Successfully processed ${result.processed} chunks with ${result.errors} errors`
      };
    } catch (error) {
      console.error('Error initializing project embeddings:', error);
      return {
        success: false,
        processed: 0,
        errors: 1,
        message: `Failed to initialize embeddings: ${error.message}`
      };
    }
  }

  /**
   * Smart knowledge extraction with embeddings-based prevention
   */
  static async smartExtract(
    projectId: string,
    content: string,
    chapterId: string,
    extractionType: 'full' | 'incremental' = 'full'
  ): Promise<{
    extracted: boolean;
    skipped: boolean;
    reason: string;
    data?: any;
  }> {
    try {
      console.log(`🧠 Starting smart extraction for chapter: ${chapterId}`);
      
      // Check if we should skip extraction
      const processingCheck = await this.checkContentProcessingNeed(
        projectId,
        content,
        chapterId
      );

      if (processingCheck.shouldSkipExtraction) {
        console.log('⏭️ Skipping extraction due to similarity');
        
        // Instead, reference existing similar content
        await this.linkToSimilarContent(projectId, chapterId, content);
        
        return {
          extracted: false,
          skipped: true,
          reason: processingCheck.reason,
          data: null
        };
      }

      console.log('📊 Proceeding with extraction - content is sufficiently novel');
      
      // Proceed with regular extraction since content is novel
      return {
        extracted: false, // Let the regular extraction process handle this
        skipped: false,
        reason: 'Content is novel - proceeding with regular extraction'
      };
    } catch (error) {
      console.error('Error in smart extraction:', error);
      return {
        extracted: false,
        skipped: false,
        reason: `Error in smart extraction: ${error.message}`
      };
    }
  }

  /**
   * Link chapter to similar existing content instead of re-extracting
   */
  private static async linkToSimilarContent(
    projectId: string,
    chapterId: string,
    content: string
  ): Promise<void> {
    try {
      console.log('🔗 Linking to similar existing content...');
      
      // Generate embedding for content
      const embeddingResult = await EmbeddingsService.generateEmbedding(content);
      
      // Find most similar chunks
      const similarChunks = await EmbeddingsService.findSimilarChunks(
        projectId,
        embeddingResult.embedding,
        5,
        0.8
      );

      if (similarChunks.length > 0) {
        console.log(`📎 Found ${similarChunks.length} similar chunks to reference`);
        
        // Update knowledge items to reference this chapter as an additional source
        for (const chunk of similarChunks.slice(0, 3)) { // Top 3 most similar
          // Add this chapter as a source to existing knowledge items
          await this.updateKnowledgeItemSources(projectId, chunk.chapter_id, chapterId);
        }
      }
    } catch (error) {
      console.error('Error linking to similar content:', error);
    }
  }

  /**
   * Update knowledge items to include additional source chapters
   */
  private static async updateKnowledgeItemSources(
    projectId: string,
    originalChapterId: string,
    additionalChapterId: string
  ): Promise<void> {
    try {
      // Update knowledge base items
      const { data: knowledgeItems } = await supabase
        .from('knowledge_base')
        .select('id, source_chapter_ids, confidence_score')
        .eq('project_id', projectId)
        .eq('source_chapter_id', originalChapterId);

      if (knowledgeItems) {
        for (const item of knowledgeItems) {
          const currentSources = Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids as string[] : [];
          if (!currentSources.includes(additionalChapterId)) {
            await supabase
              .from('knowledge_base')
              .update({
                source_chapter_ids: [...currentSources, additionalChapterId],
                confidence_score: Math.min(1.0, (item.confidence_score || 0.5) + 0.1)
              })
              .eq('id', item.id);
          }
        }
      }

      console.log(`📈 Updated knowledge items with additional source: ${additionalChapterId}`);
    } catch (error) {
      console.error('Error updating knowledge item sources:', error);
    }
  }

  /**
   * Process incremental changes to content
   */
  static async processIncrementalChanges(
    projectId: string,
    chapterId: string,
    newContent: string,
    oldContentHash?: string
  ): Promise<{
    hasSignificantChanges: boolean;
    shouldReprocess: boolean;
    changesSummary: string;
  }> {
    try {
      console.log('🔄 Processing incremental changes...');
      
      // Get existing content hash
      const { data: contentHash } = await supabase
        .from('content_hashes')
        .select('original_content_hash, has_changes')
        .eq('chapter_id', chapterId)
        .single();

      if (!contentHash) {
        return {
          hasSignificantChanges: true,
          shouldReprocess: true,
          changesSummary: 'No previous content found - full processing needed'
        };
      }

      // Calculate content similarity using embeddings
      const similarityResult = await EmbeddingsService.checkContentSimilarity(
        projectId,
        newContent,
        0.9 // Very high threshold for incremental changes
      );

      const hasSignificantChanges = !similarityResult.isSimilar;
      
      return {
        hasSignificantChanges,
        shouldReprocess: hasSignificantChanges,
        changesSummary: hasSignificantChanges 
          ? 'Significant changes detected - reprocessing needed'
          : 'Minor changes detected - no reprocessing needed'
      };
    } catch (error) {
      console.error('Error processing incremental changes:', error);
      return {
        hasSignificantChanges: true,
        shouldReprocess: true,
        changesSummary: `Error detecting changes: ${error.message}`
      };
    }
  }

  /**
   * Enhanced knowledge base optimization using the new services
   */
  static async optimizeKnowledgeBase(projectId: string): Promise<{
    optimized: boolean;
    duplicatesRemoved: number;
    embeddingsGenerated: number;
    semanticMergesPerformed: number;
    userConflictsDetected: number;
    message: string;
  }> {
    try {
      console.log(`🛠️ Enhanced knowledge base optimization for project: ${projectId}`);
      
      // Step 1: Process incremental embeddings (only for changed content)
      let totalEmbeddingsGenerated = 0;
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, content')
        .eq('project_id', projectId);
      
      if (chapters) {
        for (const chapter of chapters) {
          if (chapter.content) {
            const result = await EnhancedEmbeddingsService.processIncrementalEmbeddings(
              projectId,
              chapter.id,
              chapter.content
            );
            totalEmbeddingsGenerated += result.embeddingsGenerated;
          }
        }
      }
      
      // Step 2: Apply embedding-based semantic merging for each knowledge type
      let semanticMergesPerformed = 0;
      let userConflictsDetected = 0;
      
      // Merge character relationships
      const { data: relationships } = await supabase
        .from('character_relationships')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_newly_extracted', true);
      
      if (relationships) {
        for (const rel of relationships) {
          const mergeResult = await EmbeddingBasedSemanticMerger.mergeCharacterRelationships(projectId, rel);
          if (mergeResult.merged) {
            semanticMergesPerformed++;
            // Delete the original since it was merged
            await supabase.from('character_relationships').delete().eq('id', rel.id);
          } else if (mergeResult.conflictResolution === 'user_required') {
            userConflictsDetected++;
          }
        }
      }
      
      // Merge timeline events
      const { data: events } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_newly_extracted', true);
      
      if (events) {
        for (const event of events) {
          const mergeResult = await EmbeddingBasedSemanticMerger.mergeTimelineEvents(projectId, event);
          if (mergeResult.merged) {
            semanticMergesPerformed++;
            // Delete the original since it was merged
            await supabase.from('timeline_events').delete().eq('id', event.id);
          } else if (mergeResult.conflictResolution === 'user_required') {
            userConflictsDetected++;
          }
        }
      }
      
      // Step 3: Apply conservative deduplication (only exact duplicates)
      const deduplicationResult = await SemanticDeduplicationService.applyConservativeDeduplication(
        projectId
      );
      
      const totalDuplicatesRemoved = deduplicationResult.relationshipsRemoved +
                                    deduplicationResult.plotThreadsRemoved +
                                    deduplicationResult.timelineEventsRemoved +
                                    deduplicationResult.plotPointsRemoved +
                                    deduplicationResult.chapterSummariesRemoved +
                                    deduplicationResult.worldBuildingRemoved +
                                    deduplicationResult.themesRemoved;

      return {
        optimized: true,
        duplicatesRemoved: totalDuplicatesRemoved,
        embeddingsGenerated: totalEmbeddingsGenerated,
        semanticMergesPerformed,
        userConflictsDetected,
        message: `Enhanced optimization complete: Generated ${totalEmbeddingsGenerated} embeddings, performed ${semanticMergesPerformed} semantic merges, removed ${totalDuplicatesRemoved} duplicates, detected ${userConflictsDetected} user conflicts`
      };
    } catch (error) {
      console.error('Error in enhanced knowledge base optimization:', error);
      return {
        optimized: false,
        duplicatesRemoved: 0,
        embeddingsGenerated: 0,
        semanticMergesPerformed: 0,
        userConflictsDetected: 0,
        message: `Optimization failed: ${error.message}`
      };
    }
  }
}