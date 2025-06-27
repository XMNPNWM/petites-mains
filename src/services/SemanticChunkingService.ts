
import { supabase } from '@/integrations/supabase/client';
import { SemanticChunk, ChunkingConfig, ChunkingResult } from '@/types/aiIntelligence';
import { EmbeddingsService } from './EmbeddingsService';

export class SemanticChunkingService {
  private static defaultConfig: ChunkingConfig = {
    min_tokens: 100,
    max_tokens: 2000,
    overlap_sentences: 2,
    embedding_threshold: 0.6,
    discourse_marker_weight: 3,
    ner_shift_weight: 2,
    dialogue_shift_weight: 1
  };

  static async processChapter(
    chapterId: string,
    content: string,
    config?: Partial<ChunkingConfig>
  ): Promise<ChunkingResult> {
    console.log('Starting simplified semantic chunking for chapter:', chapterId);
    
    const chunkingConfig = { ...this.defaultConfig, ...config };
    
    // Check if chunks already exist and are up-to-date
    const existingChunks = await this.getExistingChunks(chapterId);
    
    if (existingChunks.length > 0) {
      console.log('Found existing chunks, checking if reprocessing needed...');
      return {
        chunks: existingChunks,
        total_chunks: existingChunks.length,
        processing_stats: this.calculateStats(existingChunks)
      };
    }

    // Perform simplified chunking pipeline
    const chunks = await this.performSimplifiedChunking(chapterId, content, chunkingConfig);
    
    // Store chunks in database
    await this.storeChunks(chunks);
    
    console.log(`Simplified chunking completed: ${chunks.length} chunks created`);
    
    return {
      chunks,
      total_chunks: chunks.length,
      processing_stats: this.calculateStats(chunks)
    };
  }

  private static async getExistingChunks(chapterId: string): Promise<SemanticChunk[]> {
    const { data, error } = await supabase
      .from('semantic_chunks')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('chunk_index');

    if (error) {
      console.error('Error fetching existing chunks:', error);
      return [];
    }

    return (data || []) as unknown as SemanticChunk[];
  }

  private static async performSimplifiedChunking(
    chapterId: string,
    content: string,
    config: ChunkingConfig
  ): Promise<SemanticChunk[]> {
    // Get project_id from chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('project_id')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      throw new Error('Failed to fetch chapter information');
    }

    console.log('Performing simplified text chunking...');

    // Step 1: Split content into paragraphs
    const paragraphs = this.splitIntoParagraphs(content);
    console.log(`Split into ${paragraphs.length} paragraphs`);

    // Step 2: Create chunks based on token limits
    const chunks = await this.createChunksFromParagraphs(
      chapterId,
      chapter.project_id,
      paragraphs,
      config
    );

    console.log(`Created ${chunks.length} simplified semantic chunks`);

    return chunks;
  }

  private static splitIntoParagraphs(text: string): string[] {
    // Split on double newlines (paragraph breaks) and filter empty ones
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  }

  private static async createChunksFromParagraphs(
    chapterId: string,
    projectId: string,
    paragraphs: string[],
    config: ChunkingConfig
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;
    let startPosition = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paragraphTokens = this.estimateTokens(paragraph);

      // If adding this paragraph would exceed max tokens, finalize current chunk
      if (currentTokens + paragraphTokens > config.max_tokens && currentChunk.length > 0) {
        const chunk = await this.createChunk(
          chapterId,
          projectId,
          currentChunk,
          chunkIndex,
          startPosition,
          config
        );
        chunks.push(chunk);
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, config.overlap_sentences);
        currentChunk = overlapText + (overlapText ? '\n\n' : '') + paragraph;
        currentTokens = this.estimateTokens(currentChunk);
        chunkIndex++;
        startPosition = startPosition + currentChunk.length - overlapText.length;
      } else {
        // Add paragraph to current chunk
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk if it exists and meets minimum requirements
    if (currentChunk.length > 0 && currentTokens >= config.min_tokens) {
      const chunk = await this.createChunk(
        chapterId,
        projectId,
        currentChunk,
        chunkIndex,
        startPosition,
        config
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  private static async createChunk(
    chapterId: string,
    projectId: string,
    content: string,
    chunkIndex: number,
    startPosition: number,
    config: ChunkingConfig
  ): Promise<SemanticChunk> {
    // Generate embedding for the chunk
    let embedding: number[] | null = null;
    try {
      const embeddingResult = await EmbeddingsService.generateEmbedding(content);
      embedding = embeddingResult.embedding;
    } catch (error) {
      console.warn('Failed to generate embedding for chunk:', error);
    }

    const chunk: SemanticChunk = {
      id: '', // Will be generated by database
      chapter_id: chapterId,
      project_id: projectId,
      content: content.trim(),
      chunk_index: chunkIndex,
      start_position: startPosition,
      end_position: startPosition + content.length,
      embeddings: embedding,
      embeddings_model: 'text-embedding-3-small',
      named_entities: [], // Will be populated by Gemini 2.5 Flash later
      entity_types: [], // Will be populated by Gemini 2.5 Flash later
      discourse_markers: [], // Will be populated by Gemini 2.5 Flash later
      dialogue_present: false, // Will be populated by Gemini 2.5 Flash later
      dialogue_speakers: [], // Will be populated by Gemini 2.5 Flash later
      breakpoint_score: 1,
      breakpoint_reasons: [{
        type: 'max_tokens',
        score: 1,
        description: 'Simplified paragraph-based chunking'
      }],
      overlap_with_previous: chunkIndex > 0,
      overlap_with_next: false, // Will be set when processing next chunk
      processed_at: new Date().toISOString(),
      processing_version: '2.1-simplified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return chunk;
  }

  private static getOverlapText(text: string, overlapSentences: number): string {
    // Get last few sentences for overlap
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= overlapSentences) {
      return text;
    }
    
    return sentences.slice(-overlapSentences).join('. ') + '.';
  }

  private static estimateTokens(text: string): number {
    // Rough token estimation (words * 1.3)
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  private static async storeChunks(chunks: SemanticChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const { error } = await supabase
        .from('semantic_chunks')
        .insert({
          chapter_id: chunk.chapter_id,
          project_id: chunk.project_id,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          start_position: chunk.start_position,
          end_position: chunk.end_position,
          embeddings: chunk.embeddings,
          embeddings_model: chunk.embeddings_model,
          named_entities: chunk.named_entities,
          entity_types: chunk.entity_types,
          discourse_markers: chunk.discourse_markers,
          dialogue_present: chunk.dialogue_present,
          dialogue_speakers: chunk.dialogue_speakers,
          breakpoint_score: chunk.breakpoint_score,
          breakpoint_reasons: chunk.breakpoint_reasons,
          overlap_with_previous: chunk.overlap_with_previous,
          overlap_with_next: chunk.overlap_with_next,
          processed_at: chunk.processed_at,
          processing_version: chunk.processing_version
        });

      if (error) {
        console.error('Error storing chunk:', error);
        throw error;
      }
    }
  }

  private static calculateStats(chunks: SemanticChunk[]) {
    const totalTokens = chunks.reduce((sum, chunk) => 
      sum + this.estimateTokens(chunk.content), 0
    );
    
    const avgChunkSize = totalTokens / chunks.length;
    const overlapRatio = chunks.filter(chunk => 
      chunk.overlap_with_previous || chunk.overlap_with_next
    ).length / chunks.length;
    
    return {
      total_tokens: Math.round(totalTokens),
      avg_chunk_size: Math.round(avgChunkSize),
      overlap_ratio: Math.round(overlapRatio * 100) / 100,
      breakpoint_distribution: { 'max_tokens': chunks.length },
      entity_stats: {
        total_entities: 0, // Will be populated by Gemini 2.5 Flash later
        unique_entity_types: 0, // Will be populated by Gemini 2.5 Flash later
        avg_entities_per_chunk: 0 // Will be populated by Gemini 2.5 Flash later
      },
      dialogue_ratio: 0, // Will be populated by Gemini 2.5 Flash later
      processing_version: '2.1-simplified'
    };
  }

  static async getChunksForChapter(chapterId: string): Promise<SemanticChunk[]> {
    return this.getExistingChunks(chapterId);
  }

  static async deleteChunksForChapter(chapterId: string): Promise<void> {
    const { error } = await supabase
      .from('semantic_chunks')
      .delete()
      .eq('chapter_id', chapterId);

    if (error) {
      throw error;
    }
  }

  static async getChunkSimilarity(
    projectId: string,
    queryText: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const embeddingResult = await EmbeddingsService.generateEmbedding(queryText);
      return await EmbeddingsService.findSimilarChunks(
        projectId,
        embeddingResult.embedding,
        limit
      );
    } catch (error) {
      console.error('Error finding similar chunks:', error);
      return [];
    }
  }
}
