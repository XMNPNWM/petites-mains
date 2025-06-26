
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
}

export class EmbeddingsService {
  private static readonly MODEL = 'text-embedding-3-small';
  private static readonly DIMENSION = 1536;

  /**
   * Generate embeddings using OpenRouter API
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      // For now, we'll simulate embeddings generation
      // In production, this would call OpenRouter API
      console.log('Generating embedding for text:', text.substring(0, 100) + '...');
      
      // Simulate embedding generation with random vectors (normalized)
      const embedding = this.generateSimulatedEmbedding(text);
      
      return {
        embedding,
        model: this.MODEL,
        tokens_used: Math.ceil(text.length / 4) // Rough token estimation
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate batch embeddings for multiple texts
   */
  static async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
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
      // Using Supabase vector similarity search
      const { data, error } = await supabase.rpc('match_semantic_chunks', {
        project_id: projectId,
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) throw error;

      return data || [];
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
   * Generate simulated embedding (for development/testing)
   * In production, this would be replaced with actual API calls
   */
  private static generateSimulatedEmbedding(text: string): number[] {
    // Create a deterministic but varied embedding based on text content
    const embedding = new Array(this.DIMENSION);
    const hash = this.simpleHash(text);
    
    for (let i = 0; i < this.DIMENSION; i++) {
      // Use text characteristics to generate somewhat meaningful embeddings
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
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}
