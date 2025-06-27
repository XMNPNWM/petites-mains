
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
  private static readonly MODEL = 'google/text-embedding-004';
  private static readonly DIMENSION = 768;
  private static readonly OPENROUTER_URL = 'https://openrouter.ai/api/v1/embeddings';
  
  // Rate limiting for OpenRouter (30 requests/minute for free tier)
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessingQueue = false;
  private static lastRequestTime = 0;
  private static readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  /**
   * Generate embeddings using OpenRouter API with Google's text-embedding-004
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      console.log('Generating embedding for text:', text.substring(0, 100) + '...');
      
      const embedding = await this.callOpenRouterEmbedding(text);
      
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
   * Generate batch embeddings for multiple texts with rate limiting
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    // Process in small batches to respect rate limits
    const batchSize = 3;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);
      
      // Delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL));
      }
    }
    
    return results;
  }

  /**
   * Call OpenRouter API for embeddings with rate limiting
   */
  private static async callOpenRouterEmbedding(text: string): Promise<number[]> {
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

          const response = await fetch(this.OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'StoryLoom AI'
            },
            body: JSON.stringify({
              model: this.MODEL,
              input: text
            })
          });

          if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          this.lastRequestTime = Date.now();
          
          if (data.data && data.data[0] && data.data[0].embedding) {
            resolve(data.data[0].embedding);
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
      
      const { data, error } = await supabase.rpc('match_semantic_chunks', {
        query_embedding: queryEmbedding,
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
   * Store embedding in database
   */
  static async storeEmbedding(
    chunkId: string,
    embedding: number[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('semantic_chunks')
        .update({ 
          embeddings: embedding,
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
