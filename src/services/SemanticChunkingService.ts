import { supabase } from '@/integrations/supabase/client';
import { SemanticChunk, ChunkingConfig, ChunkingResult } from '@/types/aiIntelligence';
import { EmbeddingsService } from './EmbeddingsService';
import { NERService } from './NERService';
import { DiscourseMarkersService } from './DiscourseMarkersService';
import { DialogueAnalysisService } from './DialogueAnalysisService';

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
    console.log('Starting enhanced semantic chunking for chapter:', chapterId);
    
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

    // Perform enhanced chunking pipeline
    const chunks = await this.performEnhancedChunking(chapterId, content, chunkingConfig);
    
    // Store chunks in database
    await this.storeChunks(chunks);
    
    console.log(`Enhanced chunking completed: ${chunks.length} chunks created`);
    
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

    return (data || []) as unknown as SemanticChunk[];
  }

  private static async performEnhancedChunking(
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

    console.log('Performing enhanced semantic analysis...');

    // Step 1: Initial sentence segmentation
    const sentences = this.splitIntoSentences(content);
    console.log(`Split into ${sentences.length} sentences`);

    // Step 2: Analyze each sentence for various features
    const sentenceAnalyses = await Promise.all(
      sentences.map(async (sentence, index) => {
        const position = this.getSentencePosition(sentences, index, content);
        
        return {
          text: sentence,
          index,
          position,
          entities: await NERService.extractEntities(sentence),
          discourseMarkers: DiscourseMarkersService.detectDiscourseMarkers(sentence),
          dialogueAnalysis: DialogueAnalysisService.analyzeConversationFlow(sentence),
          embedding: null as number[] | null // Will be populated for chunk boundaries
        };
      })
    );

    console.log('Completed sentence-level analysis');

    // Step 3: Determine chunk boundaries using hierarchical scoring
    const chunkBoundaries = await this.determineChunkBoundaries(
      sentenceAnalyses, 
      config
    );

    console.log(`Identified ${chunkBoundaries.length} chunk boundaries`);

    // Step 4: Create chunks with overlap and metadata
    const chunks = await this.createEnhancedChunks(
      chapterId,
      chapter.project_id,
      sentenceAnalyses,
      chunkBoundaries,
      config
    );

    console.log(`Created ${chunks.length} enhanced semantic chunks`);

    return chunks;
  }

  private static splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting that preserves dialogue
    const sentences: string[] = [];
    
    // Split on sentence boundaries but keep dialogue intact
    const parts = text.split(/([.!?]+\s+)/);
    let currentSentence = '';
    
    for (let i = 0; i < parts.length; i++) {
      currentSentence += parts[i];
      
      // Check if this is a sentence boundary
      if (i % 2 === 1 && parts[i].match(/[.!?]+\s+/)) {
        const trimmed = currentSentence.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
        currentSentence = '';
      }
    }
    
    // Add any remaining content
    if (currentSentence.trim().length > 0) {
      sentences.push(currentSentence.trim());
    }
    
    return sentences.filter(s => s.length > 0);
  }

  private static getSentencePosition(
    sentences: string[], 
    index: number, 
    fullText: string
  ): { start: number; end: number } {
    let position = 0;
    for (let i = 0; i < index; i++) {
      position += sentences[i].length;
    }
    
    return {
      start: position,
      end: position + sentences[index].length
    };
  }

  private static async determineChunkBoundaries(
    analyses: any[],
    config: ChunkingConfig
  ): Promise<number[]> {
    const boundaries: Array<{ index: number; score: number; reasons: any[] }> = [];
    let currentTokens = 0;
    let previousEmbedding: number[] | null = null;

    for (let i = 0; i < analyses.length; i++) {
      const analysis = analyses[i];
      const tokenCount = this.estimateTokens(analysis.text);
      currentTokens += tokenCount;

      // Calculate breakpoint score
      let breakpointScore = 0;
      const reasons: any[] = [];

      // 1. Token-based constraints
      if (currentTokens >= config.max_tokens) {
        breakpointScore += 10;
        reasons.push({ type: 'max_tokens', score: 10, description: 'Maximum token limit reached' });
      } else if (currentTokens >= config.min_tokens) {
        // 2. Discourse markers analysis
        const discourseScore = this.calculateDiscourseScore(analysis, config);
        breakpointScore += discourseScore.score;
        reasons.push(...discourseScore.reasons);

        // 3. Entity shift analysis
        if (i > 0) {
          const entityShift = NERService.calculateEntityShift(
            analyses[i - 1].entities,
            analysis.entities
          );
          const entityScore = entityShift.entityChangeScore * config.ner_shift_weight;
          if (entityScore > 1) {
            breakpointScore += entityScore;
            reasons.push({
              type: 'entity_shift',
              score: entityScore,
              description: `Entity shift detected: ${entityShift.newEntities.length} new, ${entityShift.removedEntities.length} removed`
            });
          }
        }

        // 4. Dialogue transition analysis
        if (i > 0) {
          const dialogueScore = DialogueAnalysisService.detectDialogueTransitions(
            analyses[i - 1].text,
            analysis.text
          ) * config.dialogue_shift_weight;
          
          if (dialogueScore > 1) {
            breakpointScore += dialogueScore;
            reasons.push({
              type: 'dialogue_transition',
              score: dialogueScore,
              description: 'Dialogue transition detected'
            });
          }
        }

        // 5. Embedding similarity (when available)
        if (breakpointScore > 3) { // Only compute embeddings for potential boundaries
          try {
            const embedding = await EmbeddingsService.generateEmbedding(analysis.text);
            analysis.embedding = embedding.embedding;

            if (previousEmbedding) {
              const similarity = EmbeddingsService.calculateCosineSimilarity(
                previousEmbedding,
                embedding.embedding
              );
              
              if (similarity < config.embedding_threshold) {
                const embeddingScore = (1 - similarity) * 5;
                breakpointScore += embeddingScore;
                reasons.push({
                  type: 'embedding_similarity',
                  score: embeddingScore,
                  description: `Low semantic similarity: ${similarity.toFixed(3)}`
                });
              }
            }
            previousEmbedding = embedding.embedding;
          } catch (error) {
            console.warn('Failed to generate embedding for boundary detection:', error);
          }
        }
      }

      // Record potential boundary
      if (breakpointScore > 2 || currentTokens >= config.max_tokens) {
        boundaries.push({
          index: i,
          score: breakpointScore,
          reasons
        });
      }

      // Reset token count if we've marked a boundary
      if (boundaries.length > 0 && boundaries[boundaries.length - 1].index === i) {
        currentTokens = 0;
        previousEmbedding = analysis.embedding;
      }
    }
    
    // Ensure we don't have too many small chunks
    const filteredBoundaries = this.filterBoundaries(boundaries, analyses, config);
    
    return filteredBoundaries.map(b => b.index);
  }

  private static calculateDiscourseScore(analysis: any, config: ChunkingConfig): {
    score: number;
    reasons: any[];
  } {
    let score = 0;
    const reasons: any[] = [];

    for (const marker of analysis.discourseMarkers) {
      const markerScore = marker.score * config.discourse_marker_weight;
      score += markerScore;
      
      reasons.push({
        type: 'discourse_marker',
        score: markerScore,
        description: `${marker.strength} ${marker.type} marker: "${marker.text}"`
      });
    }

    // Check for scene breaks
    if (DiscourseMarkersService.indicatesSceneBreak(analysis.discourseMarkers)) {
      score += 5;
      reasons.push({
        type: 'scene_break',
        score: 5,
        description: 'Scene break indicators detected'
      });
    }

    return { score: Math.min(score, 10), reasons };
  }

  private static filterBoundaries(
    boundaries: Array<{ index: number; score: number; reasons: any[] }>,
    analyses: any[],
    config: ChunkingConfig
  ): Array<{ index: number; score: number; reasons: any[] }> {
    // Sort by score (highest first)
    boundaries.sort((a, b) => b.score - a.score);
    
    const filtered: Array<{ index: number; score: number; reasons: any[] }> = [];
    let lastBoundary = -1;
    
    for (const boundary of boundaries) {
      // Ensure minimum chunk size
      const tokensSinceLastBoundary = this.calculateTokensBetween(
        analyses, lastBoundary + 1, boundary.index
      );
      
      if (tokensSinceLastBoundary >= config.min_tokens || boundary.score >= 8) {
        filtered.push(boundary);
        lastBoundary = boundary.index;
      }
    }
    
    // Sort back by index
    return filtered.sort((a, b) => a.index - b.index);
  }

  private static calculateTokensBetween(
    analyses: any[],
    start: number,
    end: number
  ): number {
    let tokens = 0;
    for (let i = start; i <= end && i < analyses.length; i++) {
      tokens += this.estimateTokens(analyses[i].text);
    }
    return tokens;
  }

  private static async createEnhancedChunks(
    chapterId: string,
    projectId: string,
    analyses: any[],
    boundaries: number[],
    config: ChunkingConfig
  ): Promise<SemanticChunk[]> {
    const chunks: SemanticChunk[] = [];
    let chunkStart = 0;

    // Add final boundary if not present
    if (boundaries.length === 0 || boundaries[boundaries.length - 1] !== analyses.length - 1) {
      boundaries.push(analyses.length - 1);
    }

    for (let i = 0; i < boundaries.length; i++) {
      const chunkEnd = boundaries[i];
      const chunkAnalyses = analyses.slice(chunkStart, chunkEnd + 1);
      
      // Build chunk content with overlap
      const overlapStart = Math.max(0, chunkStart - config.overlap_sentences);
      const overlapAnalyses = analyses.slice(overlapStart, chunkEnd + 1);
      
      const content = overlapAnalyses.map(a => a.text).join(' ');
      const coreContent = chunkAnalyses.map(a => a.text).join(' ');
      
      // Aggregate metadata
      const allEntities = chunkAnalyses.flatMap(a => a.entities);
      const allDiscourseMarkers = chunkAnalyses.flatMap(a => a.discourseMarkers);
      const dialogueAnalyses = chunkAnalyses.map(a => a.dialogueAnalysis);
      
      // Generate embedding for the chunk
      let embedding: number[] | null = null;
      try {
        const embeddingResult = await EmbeddingsService.generateEmbedding(coreContent);
        embedding = embeddingResult.embedding;
      } catch (error) {
        console.warn('Failed to generate embedding for chunk:', error);
      }

      // Find breakpoint reasons
      const boundaryInfo = boundaries.find((_, idx) => boundaries[idx] === chunkEnd);
      const breakpointReasons = boundaryInfo ? [] : []; // This would be populated by the boundary detection

      const chunk: SemanticChunk = {
        id: '', // Will be generated by database
        chapter_id: chapterId,
        project_id: projectId,
        content: content.trim(),
        chunk_index: i,
        start_position: chunkAnalyses[0]?.position?.start || 0,
        end_position: chunkAnalyses[chunkAnalyses.length - 1]?.position?.end || content.length,
        embeddings: embedding,
        embeddings_model: 'text-embedding-3-small',
        named_entities: allEntities,
        entity_types: NERService.getEntityTypes(allEntities),
        discourse_markers: allDiscourseMarkers,
        dialogue_present: dialogueAnalyses.some(d => d.hasDialogue),
        dialogue_speakers: [
          ...new Set(
            dialogueAnalyses.flatMap(d => d.primarySpeakers)
          )
        ],
        breakpoint_score: 1, // This would be calculated during boundary detection
        breakpoint_reasons: breakpointReasons,
        overlap_with_previous: overlapStart < chunkStart,
        overlap_with_next: false, // Will be set when processing next chunk
        processed_at: new Date().toISOString(),
        processing_version: '2.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Set overlap flag for previous chunk
      if (chunks.length > 0 && chunk.overlap_with_previous) {
        chunks[chunks.length - 1].overlap_with_next = true;
      }

      chunks.push(chunk);
      chunkStart = chunkEnd + 1;
    }

    return chunks;
  }

  private static estimateTokens(text: string): number {
    // Rough token estimation (words * 1.3)
    return Math.ceil(text.split(/\s+/).length * 1.3);
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
    
    const breakpointDistribution: Record<string, number> = {};
    chunks.forEach(chunk => {
      chunk.breakpoint_reasons.forEach(reason => {
        breakpointDistribution[reason.type] = (breakpointDistribution[reason.type] || 0) + 1;
      });
    });

    const entityTypes = new Set();
    const totalEntities = chunks.reduce((sum, chunk) => {
      chunk.entity_types.forEach(type => entityTypes.add(type));
      return sum + chunk.named_entities.length;
    }, 0);

    const dialogueRatio = chunks.filter(chunk => chunk.dialogue_present).length / chunks.length;

    return {
      total_tokens: Math.round(totalTokens),
      avg_chunk_size: Math.round(avgChunkSize),
      overlap_ratio: Math.round(overlapRatio * 100) / 100,
      breakpoint_distribution: breakpointDistribution,
      entity_stats: {
        total_entities: totalEntities,
        unique_entity_types: entityTypes.size,
        avg_entities_per_chunk: Math.round(totalEntities / chunks.length)
      },
      dialogue_ratio: Math.round(dialogueRatio * 100) / 100,
      processing_version: '2.0'
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
