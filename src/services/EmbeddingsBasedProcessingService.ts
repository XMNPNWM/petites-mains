import { supabase } from '@/integrations/supabase/client';
import { EmbeddingsService } from './EmbeddingsService';
import { SemanticDeduplicationService } from './SemanticDeduplicationService';

interface ProcessingResult {
  shouldSkipExtraction: boolean;
  similarContent: boolean;
  reason: string;
  suggestions?: string[];
}

export class EmbeddingsBasedProcessingService {
  /**
   * Check if content should be processed based on embeddings similarity
   */
  static async checkContentProcessingNeed(
    projectId: string,
    content: string,
    chapterId?: string
  ): Promise<ProcessingResult> {
    try {
      console.log('🔍 Checking content processing need using embeddings...');
      
      // Check similarity with existing content
      const similarityResult = await EmbeddingsService.checkContentSimilarity(
        projectId,
        content,
        0.8 // High threshold for skipping
      );

      if (similarityResult.shouldSkipExtraction) {
        console.log('⏭️ Skipping extraction - highly similar content found');
        return {
          shouldSkipExtraction: true,
          similarContent: true,
          reason: 'Content is too similar to existing analyzed content',
          suggestions: [
            'Consider referencing existing knowledge items',
            'Check if this is a duplicate chapter section',
            'Review similar content for potential consolidation'
          ]
        };
      }

      if (similarityResult.isSimilar) {
        console.log('🔄 Similar content found but proceeding with semantic deduplication');
        return {
          shouldSkipExtraction: false,
          similarContent: true,
          reason: 'Similar content found - will use enhanced deduplication',
          suggestions: [
            'Will apply semantic deduplication after extraction',
            'Knowledge items will be merged intelligently'
          ]
        };
      }

      console.log('✅ Content is novel - proceeding with full extraction');
      return {
        shouldSkipExtraction: false,
        similarContent: false,
        reason: 'Content is sufficiently novel for extraction'
      };
    } catch (error) {
      console.error('Error in content processing check:', error);
      return {
        shouldSkipExtraction: false,
        similarContent: false,
        reason: 'Error in similarity check - proceeding with extraction'
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
   * Optimize knowledge base using embeddings and deduplication
   */
  static async optimizeKnowledgeBase(projectId: string): Promise<{
    optimized: boolean;
    duplicatesRemoved: number;
    embeddingsGenerated: number;
    message: string;
  }> {
    try {
      console.log(`🛠️ Optimizing knowledge base for project: ${projectId}`);
      
      // Step 1: Generate missing embeddings
      const embeddingsResult = await this.initializeProjectEmbeddings(projectId);
      
      // Step 2: Apply semantic deduplication
      const deduplicationResult = await SemanticDeduplicationService.applyEnhancedDeduplication(
        projectId,
        0.8
      );
      
      const totalRemoved = deduplicationResult.relationshipsRemoved +
                          deduplicationResult.plotThreadsRemoved +
                          deduplicationResult.timelineEventsRemoved +
                          deduplicationResult.plotPointsRemoved +
                          deduplicationResult.chapterSummariesRemoved +
                          deduplicationResult.worldBuildingRemoved +
                          deduplicationResult.themesRemoved;

      return {
        optimized: true,
        duplicatesRemoved: totalRemoved,
        embeddingsGenerated: embeddingsResult.processed,
        message: `Optimization complete: Generated ${embeddingsResult.processed} embeddings, removed ${totalRemoved} duplicates, performed ${deduplicationResult.semanticMergesPerformed} semantic merges`
      };
    } catch (error) {
      console.error('Error optimizing knowledge base:', error);
      return {
        optimized: false,
        duplicatesRemoved: 0,
        embeddingsGenerated: 0,
        message: `Optimization failed: ${error.message}`
      };
    }
  }
}