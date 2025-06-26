
import { supabase } from '@/integrations/supabase/client';
import { SemanticChunk, ChunkingConfig, ChunkingResult } from '@/types/aiIntelligence';

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
      // For now, return existing chunks - we'll add hash comparison later
      return {
        chunks: existingChunks,
        total_chunks: existingChunks.length,
        processing_stats: this.calculateStats(existingChunks)
      };
    }

    // Perform chunking pipeline
    const chunks = await this.performChunking(chapterId, content, chunkingConfig);
    
    // Store chunks in database
    await this.storeChunks(chunks);
    
    console.log(`Chunking completed: ${chunks.length} chunks created`);
    
    return {
      chunks,
      total_chunks: chunks.length,
      processing_stats: this.calculateStats(chunks)
    };
  }

  private static async getExistingChunks(chapterId: string): Promise<SemanticChunk[]> {
    const { data, error } = await supabase
      .from('semantic_chunks' as any)
      .select('*')
      .eq('chapter_id', chapterId)
      .order('chunk_index');

    if (error) {
      console.error('Error fetching existing chunks:', error);
      return [];
    }

    return (data || []) as SemanticChunk[];
  }

  private static async performChunking(
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

    // For now, implement basic sentence-based chunking
    // This will be enhanced with embeddings, NER, etc. in Sub-Phase 1D.2
    const sentences = this.splitIntoSentences(content);
    const chunks: SemanticChunk[] = [];
    
    let currentChunk = '';
    let currentStart = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + sentence;
      
      // Simple token count approximation (words * 1.3)
      const tokenCount = potentialChunk.split(/\s+/).length * 1.3;
      
      // Check if we should break here
      if (tokenCount >= config.max_tokens || 
          (tokenCount >= config.min_tokens && this.shouldBreakHere(sentence, config))) {
        
        // Create chunk
        const chunk = this.createChunk(
          chapterId,
          chapter.project_id,
          currentChunk,
          chunkIndex,
          currentStart,
          currentStart + currentChunk.length,
          config
        );
        
        chunks.push(chunk);
        
        // Start new chunk with overlap
        const overlapSentences = sentences.slice(
          Math.max(0, i - config.overlap_sentences), 
          i
        );
        currentChunk = overlapSentences.join(' ') + sentence;
        currentStart = currentStart + currentChunk.length - currentChunk.length;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    // Add final chunk if remaining content
    if (currentChunk.trim()) {
      const chunk = this.createChunk(
        chapterId,
        chapter.project_id,
        currentChunk,
        chunkIndex,
        currentStart,
        currentStart + currentChunk.length,
        config
      );
      chunks.push(chunk);
    }

    return chunks;
  }

  private static splitIntoSentences(text: string): string[] {
    // Basic sentence splitting - will be enhanced later
    return text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0);
  }

  private static shouldBreakHere(sentence: string, config: ChunkingConfig): boolean {
    // Simple heuristics for now - will be enhanced with AI analysis
    const discourseMarkers = [
      'meanwhile', 'later', 'suddenly', 'however', 'therefore',
      'chapter', 'part', 'the next day', 'hours later'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return discourseMarkers.some(marker => lowerSentence.includes(marker));
  }

  private static createChunk(
    chapterId: string,
    projectId: string,
    content: string,
    index: number,
    startPos: number,
    endPos: number,
    config: ChunkingConfig
  ): SemanticChunk {
    return {
      id: '', // Will be generated by database
      chapter_id: chapterId,
      project_id: projectId,
      content: content.trim(),
      chunk_index: index,
      start_position: startPos,
      end_position: endPos,
      embeddings_model: 'text-embedding-3-small',
      named_entities: [], // Will be populated by NER
      entity_types: [],
      discourse_markers: [],
      dialogue_present: content.includes('"') || content.includes("'"),
      dialogue_speakers: [],
      breakpoint_score: 1,
      breakpoint_reasons: [
        {
          type: 'min_tokens',
          score: 1,
          description: 'Basic sentence-based chunking'
        }
      ],
      processed_at: new Date().toISOString(),
      processing_version: '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private static async storeChunks(chunks: SemanticChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const { error } = await supabase
        .from('semantic_chunks' as any)
        .insert({
          chapter_id: chunk.chapter_id,
          project_id: chunk.project_id,
          content: chunk.content,
          chunk_index: chunk.chunk_index,
          start_position: chunk.start_position,
          end_position: chunk.end_position,
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
      sum + (chunk.content.split(/\s+/).length * 1.3), 0
    );
    
    const avgChunkSize = totalTokens / chunks.length;
    const overlapRatio = chunks.filter(chunk => 
      chunk.overlap_with_previous || chunk.overlap_with_next
    ).length / chunks.length;
    
    const breakpointDistribution: Record<string, number> = {};
    chunks.forEach(chunk => {
      chunk.breakpoint_reasons.forEach(reason => {
        breakpointDistribution[reason.type] = (breakpointDistribution[reason.type] || 0) + 1;
      });
    });

    return {
      total_tokens: Math.round(totalTokens),
      avg_chunk_size: Math.round(avgChunkSize),
      overlap_ratio: Math.round(overlapRatio * 100) / 100,
      breakpoint_distribution
    };
  }

  static async getChunksForChapter(chapterId: string): Promise<SemanticChunk[]> {
    return this.getExistingChunks(chapterId);
  }

  static async deleteChunksForChapter(chapterId: string): Promise<void> {
    const { error } = await supabase
      .from('semantic_chunks' as any)
      .delete()
      .eq('chapter_id', chapterId);

    if (error) {
      throw error;
    }
  }
}
