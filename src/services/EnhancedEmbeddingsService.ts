import { supabase } from '@/integrations/supabase/client';
import { EmbeddingsService, SimilarityResult } from './EmbeddingsService';
import crypto from 'crypto';

interface ChunkSimilarityResult extends SimilarityResult {
  content_hash: string;
}

interface SmartContentLinkResult {
  itemsLinked: number;
  confidenceBoostsApplied: number;
  message: string;
}

/**
 * Enhanced embeddings service that implements the complete AI analysis workflow
 * with chunk-level similarity checking, smart content linking, and incremental processing
 */
export class EnhancedEmbeddingsService extends EmbeddingsService {
  
  /**
   * Phase 1: Enhanced chunk-level similarity check with proper thresholds
   */
  static async checkChunkLevelSimilarity(
    projectId: string,
    content: string,
    excludeChapterId?: string
  ): Promise<{
    shouldSkipExtraction: boolean;
    similarityScore: number;
    similarChunks: ChunkSimilarityResult[];
    recommendedAction: 'skip_and_link' | 'proceed_with_enhanced_dedup' | 'proceed_normal';
    reasoning: string;
  }> {
    try {
      console.log('🔍 Enhanced chunk-level similarity check starting...');
      
      // Break content into semantic chunks
      const contentChunks = await this.createSemanticChunks(content);
      
      let maxSimilarity = 0;
      let allSimilarChunks: ChunkSimilarityResult[] = [];
      
      // Check each chunk against existing embeddings
      for (const chunk of contentChunks) {
        const embeddingResult = await this.generateEmbedding(chunk.content);
        
        // Use enhanced similarity search that excludes current chapter
        const { data: similarChunks, error } = await supabase.rpc(
          'match_semantic_chunks_enhanced',
          {
            query_embedding: `[${embeddingResult.embedding.join(',')}]`,
            match_threshold: 0.70, // Lower threshold to catch more potential matches
            match_count: 5,
            filter_project_id: projectId,
            exclude_chapter_id: excludeChapterId
          }
        );
        
        if (error) {
          console.error('Error in enhanced similarity search:', error);
          continue;
        }
        
        if (similarChunks && similarChunks.length > 0) {
          const topSimilarity = similarChunks[0].similarity;
          maxSimilarity = Math.max(maxSimilarity, topSimilarity);
          
          allSimilarChunks.push(...similarChunks.map(chunk => ({
            ...chunk,
            content_hash: chunk.content_hash || ''
          })));
        }
      }
      
      // Apply enhanced decision logic based on actual cosine similarity
      let shouldSkipExtraction = false;
      let recommendedAction: 'skip_and_link' | 'proceed_with_enhanced_dedup' | 'proceed_normal' = 'proceed_normal';
      let reasoning = '';
      
      if (maxSimilarity >= 0.90) {
        shouldSkipExtraction = true;
        recommendedAction = 'skip_and_link';
        reasoning = `Content is highly similar (${(maxSimilarity * 100).toFixed(1)}%) to existing content. Will skip extraction and link to existing knowledge.`;
      } else if (maxSimilarity >= 0.80) {
        shouldSkipExtraction = false;
        recommendedAction = 'proceed_with_enhanced_dedup';
        reasoning = `Content has moderate similarity (${(maxSimilarity * 100).toFixed(1)}%). Will proceed with enhanced semantic deduplication.`;
      } else {
        shouldSkipExtraction = false;
        recommendedAction = 'proceed_normal';
        reasoning = `Content is novel (${(maxSimilarity * 100).toFixed(1)}% max similarity). Proceeding with normal extraction.`;
      }
      
      console.log(`📊 Enhanced similarity result: ${reasoning}`);
      
      return {
        shouldSkipExtraction,
        similarityScore: maxSimilarity,
        similarChunks: allSimilarChunks,
        recommendedAction,
        reasoning
      };
    } catch (error) {
      console.error('Error in enhanced chunk-level similarity check:', error);
      return {
        shouldSkipExtraction: false,
        similarityScore: 0,
        similarChunks: [],
        recommendedAction: 'proceed_normal',
        reasoning: 'Error in similarity check - proceeding with normal extraction'
      };
    }
  }
  
  /**
   * Smart content linking for highly similar content (≥90% similarity)
   */
  static async smartContentLinking(
    projectId: string,
    chapterId: string,
    similarChunks: ChunkSimilarityResult[]
  ): Promise<SmartContentLinkResult> {
    try {
      console.log('🔗 Starting smart content linking...');
      
      let itemsLinked = 0;
      let confidenceBoostsApplied = 0;
      
      // Group similar chunks by their source chapters
      const chapterGroups = new Map<string, ChunkSimilarityResult[]>();
      for (const chunk of similarChunks) {
        if (chunk.similarity >= 0.90) {
          const chapterKey = chunk.chapter_id;
          if (!chapterGroups.has(chapterKey)) {
            chapterGroups.set(chapterKey, []);
          }
          chapterGroups.get(chapterKey)!.push(chunk);
        }
      }
      
      // Link to knowledge items from highly similar chapters
      for (const [sourceChapterId, chunks] of chapterGroups) {
        await this.linkChapterToExistingKnowledge(projectId, chapterId, sourceChapterId);
        itemsLinked += chunks.length;
      }
      
      // Apply confidence boosts to linked knowledge items
      confidenceBoostsApplied = await this.applyConfidenceBoosts(projectId, chapterId);
      
      const message = `Linked ${itemsLinked} items and applied ${confidenceBoostsApplied} confidence boosts`;
      console.log(`✅ Smart content linking complete: ${message}`);
      
      return {
        itemsLinked,
        confidenceBoostsApplied,
        message
      };
    } catch (error) {
      console.error('Error in smart content linking:', error);
      return {
        itemsLinked: 0,
        confidenceBoostsApplied: 0,
        message: `Error in smart content linking: ${error.message}`
      };
    }
  }
  
  /**
   * Incremental embeddings processing - only process changed chunks
   */
  static async processIncrementalEmbeddings(
    projectId: string,
    chapterId: string,
    content: string
  ): Promise<{
    chunksProcessed: number;
    chunksSkipped: number;
    embeddingsGenerated: number;
  }> {
    try {
      console.log('🔄 Starting incremental embeddings processing...');
      
      const contentChunks = await this.createSemanticChunks(content);
      let chunksProcessed = 0;
      let chunksSkipped = 0;
      let embeddingsGenerated = 0;
      
      for (const chunk of contentChunks) {
        const contentHash = this.generateContentHash(chunk.content);
        
        // Check if chunk already exists with same hash
        const { data: existingChunk, error } = await supabase
          .from('semantic_chunks')
          .select('id, embeddings, content_hash, embedding_status')
          .eq('chapter_id', chapterId)
          .eq('chunk_index', chunk.index)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking existing chunk:', error);
          continue;
        }
        
        if (existingChunk && existingChunk.content_hash === contentHash && existingChunk.embeddings) {
          // Chunk unchanged and already has embeddings
          chunksSkipped++;
          console.log(`⏭️ Skipping unchanged chunk ${chunk.index}`);
          continue;
        }
        
        // Generate embedding for new or changed chunk
        const embeddingResult = await this.generateEmbedding(chunk.content);
        
        // Upsert chunk with new embedding and hash
        const { error: upsertError } = await supabase
          .from('semantic_chunks')
          .upsert({
            id: existingChunk?.id || undefined,
            chapter_id: chapterId,
            project_id: projectId,
            chunk_index: chunk.index,
            start_position: chunk.start,
            end_position: chunk.end,
            content: chunk.content,
            content_hash: contentHash,
            embeddings: JSON.stringify(embeddingResult.embedding),
            embeddings_model: embeddingResult.model,
            embedding_status: 'completed',
            last_embedded_at: new Date().toISOString(),
            breakpoint_score: chunk.breakpointScore || 0.5,
            updated_at: new Date().toISOString()
          });
        
        if (upsertError) {
          console.error('Error upserting chunk:', upsertError);
          continue;
        }
        
        chunksProcessed++;
        embeddingsGenerated++;
        
        // Rate limiting to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Incremental processing complete: ${chunksProcessed} processed, ${chunksSkipped} skipped, ${embeddingsGenerated} embeddings generated`);
      
      return {
        chunksProcessed,
        chunksSkipped,
        embeddingsGenerated
      };
    } catch (error) {
      console.error('Error in incremental embeddings processing:', error);
      throw error;
    }
  }
  
  /**
   * Create semantic chunks from content
   */
  private static async createSemanticChunks(content: string): Promise<Array<{
    content: string;
    index: number;
    start: number;
    end: number;
    breakpointScore?: number;
  }>> {
    // Simple sentence-based chunking for now
    // In production, this could use more sophisticated NLP techniques
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    
    let currentPosition = 0;
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length === 0) continue;
      
      const start = content.indexOf(sentence, currentPosition);
      const end = start + sentence.length;
      
      chunks.push({
        content: sentence,
        index: i,
        start,
        end,
        breakpointScore: 0.5
      });
      
      currentPosition = end;
    }
    
    return chunks;
  }
  
  /**
   * Generate content hash for change detection
   */
  private static generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content.trim()).digest('hex');
  }
  
  /**
   * Link new chapter to existing knowledge from similar chapters
   */
  private static async linkChapterToExistingKnowledge(
    projectId: string,
    newChapterId: string,
    similarChapterId: string
  ): Promise<void> {
    try {
        // Link to knowledge base items - simplified approach
        const { data: existingItems } = await supabase
          .from('knowledge_base')
          .select('id, source_chapter_ids')
          .eq('project_id', projectId)
          .eq('source_chapter_id', similarChapterId);
        
        if (existingItems) {
          for (const item of existingItems) {
            const currentIds = Array.isArray(item.source_chapter_ids) ? item.source_chapter_ids : [];
            if (!currentIds.includes(newChapterId)) {
              await supabase
                .from('knowledge_base')
                .update({
                  source_chapter_ids: [...currentIds, newChapterId],
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.id);
            }
          }
        }
      
      // Link to other knowledge types similarly...
      // (character_relationships, plot_threads, etc.)
      
    } catch (error) {
      console.error('Error in linkChapterToExistingKnowledge:', error);
    }
  }
  
  /**
   * Apply confidence boosts to linked knowledge items
   */
  private static async applyConfidenceBoosts(
    projectId: string,
    chapterId: string
  ): Promise<number> {
    try {
      let boostsApplied = 0;
      
      // Boost confidence for knowledge base items
      const { data: kbItems, error: kbError } = await supabase
        .from('knowledge_base')
        .select('id, confidence_score')
        .eq('project_id', projectId)
        .contains('source_chapter_ids', [chapterId]);
      
      if (!kbError && kbItems) {
        for (const item of kbItems) {
          const newConfidence = Math.min(1.0, (item.confidence_score || 0.5) + 0.1);
          await supabase
            .from('knowledge_base')
            .update({ 
              confidence_score: newConfidence,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          boostsApplied++;
        }
      }
      
      return boostsApplied;
    } catch (error) {
      console.error('Error applying confidence boosts:', error);
      return 0;
    }
  }
}
