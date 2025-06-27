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
    console.log('Starting semantic chunking for chapter:', chapterId);
    
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

    // Perform semantic chunking pipeline with Google embeddings
    const chunks = await this.performSemanticChunking(chapterId, content, chunkingConfig);
    
    // Store chunks in database
    await this.storeChunks(chunks);
    
    console.log(`Semantic chunking completed: ${chunks.length} chunks created`);
    
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

    return (data || []).map(chunk => ({
      ...chunk,
      embeddings: EmbeddingsService.parseEmbedding(chunk.embeddings),
      named_entities: Array.isArray(chunk.named_entities) ? chunk.named_entities : [],
      entity_types: Array.isArray(chunk.entity_types) ? chunk.entity_types : [],
      discourse_markers: Array.isArray(chunk.discourse_markers) ? chunk.discourse_markers : [],
      dialogue_speakers: Array.isArray(chunk.dialogue_speakers) ? chunk.dialogue_speakers : [],
      breakpoint_reasons: Array.isArray(chunk.breakpoint_reasons) ? chunk.breakpoint_reasons : []
    })) as SemanticChunk[];
  }

  private static async performSemanticChunking(
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

    console.log('Performing semantic text chunking with Google embeddings...');

    // Step 1: Split content into paragraphs
    const paragraphs = this.splitIntoParagraphs(content);
    console.log(`Split into ${paragraphs.length} paragraphs`);

    // Step 2: Create chunks based on semantic similarity and token limits
    const chunks = await this.createSemanticChunks(
      chapterId,
      chapter.project_id,
      paragraphs,
      config
    );

    console.log(`Created ${chunks.length} semantic chunks with Google embeddings`);

    return chunks;
  }

  private static splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0);
  }

  private static async createSemanticChunks(
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
    let lastEmbedding: number[] | null = null;

    // Generate embeddings for paragraphs to determine semantic boundaries
    const paragraphEmbeddings: Array<{ text: string; embedding: number[] | null }> = [];
    
    // Process paragraphs in batches to respect rate limits
    const batchSize = 3;
    for (let i = 0; i < paragraphs.length; i += batchSize) {
      const batch = paragraphs.slice(i, i + batchSize);
      try {
        const embeddingResults = await EmbeddingsService.generateBatchEmbeddings(batch);
        batch.forEach((paragraph, idx) => {
          paragraphEmbeddings.push({
            text: paragraph,
            embedding: embeddingResults[idx]?.embedding || null
          });
        });
      } catch (error) {
        console.warn('Failed to generate embeddings for batch, using text-based chunking:', error);
        batch.forEach(paragraph => {
          paragraphEmbeddings.push({ text: paragraph, embedding: null });
        });
      }
      
      // Rate limiting delay
      if (i + batchSize < paragraphs.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    for (let i = 0; i < paragraphEmbeddings.length; i++) {
      const { text: paragraph, embedding } = paragraphEmbeddings[i];
      const paragraphTokens = this.estimateTokens(paragraph);

      // Calculate semantic similarity with previous chunk
      let semanticBreak = false;
      if (lastEmbedding && embedding) {
        const similarity = EmbeddingsService.calculateCosineSimilarity(lastEmbedding, embedding);
        semanticBreak = similarity < config.embedding_threshold;
      }

      // Determine if we should create a new chunk
      const tokenLimitReached = currentTokens + paragraphTokens > config.max_tokens;
      const shouldBreak = (tokenLimitReached || semanticBreak) && currentChunk.length > 0;

      if (shouldBreak) {
        // Finalize current chunk
        const chunk = await this.createChunk(
          chapterId,
          projectId,
          currentChunk,
          chunkIndex,
          startPosition,
          config,
          lastEmbedding
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

      lastEmbedding = embedding;
    }

    // Add final chunk if it exists and meets minimum requirements
    if (currentChunk.length > 0 && currentTokens >= config.min_tokens) {
      const chunk = await this.createChunk(
        chapterId,
        projectId,
        currentChunk,
        chunkIndex,
        startPosition,
        config,
        lastEmbedding
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
    config: ChunkingConfig,
    embedding: number[] | null
  ): Promise<SemanticChunk> {
    // Generate embedding for the chunk if not provided
    let chunkEmbedding = embedding;
    if (!chunkEmbedding) {
      try {
        const embeddingResult = await EmbeddingsService.generateEmbedding(content);
        chunkEmbedding = embeddingResult.embedding;
      } catch (error) {
        console.warn('Failed to generate embedding for chunk:', error);
        chunkEmbedding = null;
      }
    }

    const chunk: SemanticChunk = {
      id: '',
      chapter_id: chapterId,
      project_id: projectId,
      content: content.trim(),
      chunk_index: chunkIndex,
      start_position: startPosition,
      end_position: startPosition + content.length,
      embeddings: chunkEmbedding,
      embeddings_model: 'text-embedding-004',
      named_entities: [],
      entity_types: [],
      discourse_markers: [],
      dialogue_present: false,
      dialogue_speakers: [],
      breakpoint_score: embedding ? 0.8 : 0.5,
      breakpoint_reasons: [{
        type: embedding ? 'embedding_drop' : 'max_tokens',
        score: embedding ? 0.8 : 0.5,
        description: embedding ? 'Semantic boundary detected' : 'Token limit reached'
      }],
      overlap_with_previous: chunkIndex > 0,
      overlap_with_next: false,
      processed_at: new Date().toISOString(),
      processing_version: '2.2-google-embeddings',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return chunk;
  }

  private static getOverlapText(text: string, overlapSentences: number): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= overlapSentences) {
      return text;
    }
    
    return sentences.slice(-overlapSentences).join('. ') + '.';
  }

  private static estimateTokens(text: string): number {
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
          embeddings: chunk.embeddings ? JSON.stringify(chunk.embeddings) : null, // Convert to JSON string
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
    
    const breakpointTypes = chunks.reduce((acc, chunk) => {
      chunk.breakpoint_reasons.forEach(reason => {
        acc[reason.type] = (acc[reason.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total_tokens: Math.round(totalTokens),
      avg_chunk_size: Math.round(avgChunkSize),
      overlap_ratio: Math.round(overlapRatio * 100) / 100,
      breakpoint_distribution: breakpointTypes,
      entity_stats: {
        total_entities: 0,
        unique_entity_types: 0,
        avg_entities_per_chunk: 0
      },
      dialogue_ratio: 0,
      processing_version: '2.2-google-embeddings'
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
