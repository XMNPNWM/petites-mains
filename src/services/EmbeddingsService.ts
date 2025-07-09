import { supabase } from '@/integrations/supabase/client';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens_used: number;
}

export interface SimilarityResult {
  similarity: number;
  chunk_id: string;
  content: string;
  chunk_index: number;
  chapter_id: string;
}

export class EmbeddingsService {
  private static readonly MODEL = 'text-embedding-004';
  private static readonly DIMENSION = 768;
  
  // Rate limiting for Google AI (60 requests/minute for free tier)
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessingQueue = false;
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  /**
   * Generate embeddings using Google AI API with text-embedding-004
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      console.log('Generating embedding for text:', text.substring(0, 100) + '...');
      
      const embedding = await this.callGoogleAIEmbedding(text);
      
      return {
        embedding,
        model: this.MODEL,
        tokens_used: Math.ceil(text.length / 4) // Rough token estimation
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback to simulated embedding for development
      return {
        embedding: this.generateSimulatedEmbedding(text),
        model: this.MODEL + '-simulated',
        tokens_used: Math.ceil(text.length / 4)
      };
    }
  }

  /**
   * Call Google AI API for embeddings using proper GoogleGenAI client pattern
   */
  private static async callGoogleAIEmbedding(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Ensure minimum interval between requests
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => 
              setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            );
          }

          // Use Supabase edge function to call Google AI API properly
          const { data, error } = await supabase.functions.invoke('generate-embedding', {
            body: { text, model: this.MODEL }
          });

          if (error) {
            throw new Error(`Google AI API error: ${error.message}`);
          }

          this.lastRequestTime = Date.now();
          
          if (data && data.embedding) {
            resolve(data.embedding);
          } else {
            throw new Error('Invalid embedding response format');
          }
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private static async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find similar chunks using vector similarity search
   */
  static async findSimilarChunks(
    projectId: string,
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<SimilarityResult[]> {
    try {
      console.log('Finding similar chunks for project:', projectId);
      
      // Convert the embedding array to a string format that PostgreSQL can handle
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      
      const { data, error } = await supabase.rpc('match_semantic_chunks', {
        query_embedding: embeddingString,
        match_threshold: threshold,
        match_count: limit,
        filter_project_id: projectId
      });

      if (error) {
        console.error('Error in similarity search:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        similarity: item.similarity,
        chunk_id: item.id,
        content: item.content,
        chunk_index: item.chunk_index,
        chapter_id: item.chapter_id
      }));
    } catch (error) {
      console.error('Error finding similar chunks:', error);
      return [];
    }
  }

  /**
   * Store embedding in database (convert to JSON string)
   */
  static async storeEmbedding(
    chunkId: string,
    embedding: number[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('semantic_chunks')
        .update({ 
          embeddings: JSON.stringify(embedding),
          embeddings_model: this.MODEL 
        })
        .eq('id', chunkId);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  /**
   * Check if content is similar to existing chunks using embeddings
   */
  static async checkContentSimilarity(
    projectId: string,
    content: string,
    similarityThreshold: number = 0.8
  ): Promise<{
    isSimilar: boolean;
    similarChunks: SimilarityResult[];
    shouldSkipExtraction: boolean;
  }> {
    try {
      console.log('🔍 Checking content similarity for:', content.substring(0, 100) + '...');
      
      // Generate embedding for the content
      const embeddingResult = await this.generateEmbedding(content);
      
      // Find similar chunks
      const similarChunks = await this.findSimilarChunks(
        projectId,
        embeddingResult.embedding,
        10,
        similarityThreshold
      );

      const isSimilar = similarChunks.length > 0;
      const shouldSkipExtraction = isSimilar && similarChunks[0]?.similarity >= 0.85;

      console.log(`📊 Similarity check results: ${similarChunks.length} similar chunks found`);
      if (shouldSkipExtraction) {
        console.log(`⏭️ Skipping extraction - content too similar (${similarChunks[0].similarity})`);
      }

      return {
        isSimilar,
        similarChunks,
        shouldSkipExtraction
      };
    } catch (error) {
      console.error('Error checking content similarity:', error);
      return {
        isSimilar: false,
        similarChunks: [],
        shouldSkipExtraction: false
      };
    }
  }

  /**
   * Process embeddings for all chunks in a project that don't have them
   */
  static async processProjectEmbeddings(projectId: string): Promise<{
    processed: number;
    skipped: number;
    errors: number;
  }> {
    try {
      console.log(`🚀 Processing embeddings for project: ${projectId}`);
      
      // Get chunks without embeddings
      const { data: chunks, error } = await supabase
        .from('semantic_chunks')
        .select('id, content')
        .eq('project_id', projectId)
        .is('embeddings', null);

      if (error) throw error;

      if (!chunks || chunks.length === 0) {
        console.log('✅ All chunks already have embeddings');
        return { processed: 0, skipped: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      console.log(`📝 Processing ${chunks.length} chunks...`);

      // Process chunks in batches to respect rate limits
      for (const chunk of chunks) {
        try {
          const embeddingResult = await this.generateEmbedding(chunk.content);
          await this.storeEmbedding(chunk.id, embeddingResult.embedding);
          processed++;
          
          // Log progress every 10 chunks
          if (processed % 10 === 0) {
            console.log(`📊 Processed ${processed}/${chunks.length} chunks`);
          }
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL));
        } catch (error) {
          console.error(`❌ Error processing chunk ${chunk.id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Embeddings processing complete: ${processed} processed, ${errors} errors`);
      
      return {
        processed,
        skipped: 0,
        errors
      };
    } catch (error) {
      console.error('Error processing project embeddings:', error);
      throw error;
    }
  }

  /**
   * Parse embedding from database (convert from JSON string)
   */
  static parseEmbedding(embeddingData: any): number[] | null {
    if (!embeddingData) return null;
    
    if (typeof embeddingData === 'string') {
      try {
        return JSON.parse(embeddingData);
      } catch (error) {
        console.error('Error parsing embedding:', error);
        return null;
      }
    }
    
    if (Array.isArray(embeddingData)) {
      return embeddingData;
    }
    
    return null;
  }

  /**
   * Generate simulated embedding (for development/testing)
   */
  private static generateSimulatedEmbedding(text: string): number[] {
    const embedding = new Array(this.DIMENSION);
    const hash = this.simpleHash(text);
    
    for (let i = 0; i < this.DIMENSION; i++) {
      const seed = hash + i;
      embedding[i] = Math.sin(seed) * Math.cos(seed * 0.1) * 0.1;
    }
    
    // Normalize the vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}
