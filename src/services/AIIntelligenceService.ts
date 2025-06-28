import { supabase } from '@/integrations/supabase/client';
import { SemanticChunk } from '@/types/aiIntelligence';
import { EmbeddingsService } from './EmbeddingsService';
import { GoogleAIService } from './GoogleAIService';

export interface KnowledgeExtractionConfig {
  batchSize: number;
  confidenceThreshold: number;
  extractionTypes: Array<'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive'>;
  enableCrossChapterConsistency: boolean;
}

export interface ExtractionResult {
  success: boolean;
  extractionsCount: number;
  processingTime: number;
  averageConfidence: number;
  errors: string[];
}

export class AIIntelligenceService {
  private static readonly DEFAULT_CONFIG: KnowledgeExtractionConfig = {
    batchSize: 5,
    confidenceThreshold: 0.6,
    extractionTypes: ['comprehensive'],
    enableCrossChapterConsistency: true
  };

  /**
   * Convert database chunks to SemanticChunk objects with proper embedding parsing
   */
  private static convertDbChunksToSemanticChunks(dbChunks: any[]): SemanticChunk[] {
    return dbChunks.map(chunk => ({
      ...chunk,
      embeddings: EmbeddingsService.parseEmbedding(chunk.embeddings),
      named_entities: Array.isArray(chunk.named_entities) ? chunk.named_entities : [],
      entity_types: Array.isArray(chunk.entity_types) ? chunk.entity_types : [],
      discourse_markers: Array.isArray(chunk.discourse_markers) ? chunk.discourse_markers : [],
      dialogue_speakers: Array.isArray(chunk.dialogue_speakers) ? chunk.dialogue_speakers : [],
      breakpoint_reasons: Array.isArray(chunk.breakpoint_reasons) ? chunk.breakpoint_reasons : []
    })) as SemanticChunk[];
  }

  /**
   * Extract knowledge from all chunks in a project using Google AI
   */
  static async extractProjectKnowledge(
    projectId: string,
    config: Partial<KnowledgeExtractionConfig> = {}
  ): Promise<ExtractionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    console.log('Starting project knowledge extraction with Google AI:', projectId);

    try {
      // Get all semantic chunks for the project
      const { data: chunks, error } = await supabase
        .from('semantic_chunks')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter_id, chunk_index');

      if (error) throw error;
      if (!chunks || chunks.length === 0) {
        return {
          success: true,
          extractionsCount: 0,
          processingTime: 0,
          averageConfidence: 0,
          errors: ['No semantic chunks found for project']
        };
      }

      const startTime = Date.now();
      let totalExtractions = 0;
      let totalConfidence = 0;
      const errors: string[] = [];

      // Convert database chunks to proper SemanticChunk objects
      const semanticChunks = this.convertDbChunksToSemanticChunks(chunks);

      // Process chunks in batches using Google AI
      for (let i = 0; i < semanticChunks.length; i += finalConfig.batchSize) {
        const batch = semanticChunks.slice(i, i + finalConfig.batchSize);
        
        try {
          const batchResult = await this.processBatchWithGoogleAI(batch, projectId, finalConfig);
          totalExtractions += batchResult.extractionsCount;
          totalConfidence += batchResult.totalConfidence;
        } catch (error) {
          console.error(`Error processing batch ${i}-${i + finalConfig.batchSize}:`, error);
          errors.push(`Batch ${i}-${i + finalConfig.batchSize}: ${error.message}`);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Run cross-chapter consistency check if enabled
      if (finalConfig.enableCrossChapterConsistency) {
        try {
          await this.checkCrossChapterConsistency(projectId);
        } catch (error) {
          console.error('Cross-chapter consistency check failed:', error);
          errors.push(`Consistency check: ${error.message}`);
        }
      }

      const processingTime = Date.now() - startTime;
      const averageConfidence = totalExtractions > 0 ? totalConfidence / totalExtractions : 0;

      return {
        success: errors.length === 0,
        extractionsCount: totalExtractions,
        processingTime,
        averageConfidence,
        errors
      };

    } catch (error) {
      console.error('Error in project knowledge extraction:', error);
      return {
        success: false,
        extractionsCount: 0,
        processingTime: 0,
        averageConfidence: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Extract knowledge from a single chapter using Google AI
   */
  static async extractChapterKnowledge(
    chapterId: string,
    config: Partial<KnowledgeExtractionConfig> = {}
  ): Promise<ExtractionResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    console.log('Starting chapter knowledge extraction with Google AI:', chapterId);

    try {
      // Get semantic chunks for the chapter
      const { data: chunks, error } = await supabase
        .from('semantic_chunks')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('chunk_index');

      if (error) throw error;
      if (!chunks || chunks.length === 0) {
        return {
          success: true,
          extractionsCount: 0,
          processingTime: 0,
          averageConfidence: 0,
          errors: ['No semantic chunks found for chapter']
        };
      }

      const startTime = Date.now();
      const semanticChunks = this.convertDbChunksToSemanticChunks(chunks);
      const batchResult = await this.processBatchWithGoogleAI(semanticChunks, chunks[0].project_id, finalConfig);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        extractionsCount: batchResult.extractionsCount,
        processingTime,
        averageConfidence: batchResult.extractionsCount > 0 ? 
          batchResult.totalConfidence / batchResult.extractionsCount : 0,
        errors: []
      };

    } catch (error) {
      console.error('Error in chapter knowledge extraction:', error);
      return {
        success: false,
        extractionsCount: 0,
        processingTime: 0,
        averageConfidence: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Create character relationship
   */
  static async createCharacterRelationship(relationshipData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('character_relationships')
        .insert(relationshipData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating character relationship:', error);
      throw error;
    }
  }

  /**
   * Process a batch of semantic chunks using Google AI
   */
  private static async processBatchWithGoogleAI(
    chunks: SemanticChunk[],
    projectId: string,
    config: KnowledgeExtractionConfig
  ): Promise<{ extractionsCount: number; totalConfidence: number }> {
    // Get existing knowledge for context
    const existingKnowledge = await this.getExistingKnowledge(projectId);

    // Combine chunk content for analysis
    const combinedContent = chunks.map(chunk => chunk.content).join('\n\n');

    let totalExtractions = 0;
    let totalConfidence = 0;

    // Process each extraction type using Google AI Service
    for (const extractionType of config.extractionTypes) {
      try {
        console.log(`Processing ${extractionType} extraction with Google AI for ${chunks.length} chunks`);
        
        // Use GoogleAIService for extraction
        const extractedData = await GoogleAIService.extractKnowledge(
          combinedContent,
          extractionType,
          existingKnowledge
        );
        
        // Store extracted knowledge in database
        const storedCount = await this.storeExtractedKnowledge(extractedData, projectId, chunks);
        totalExtractions += storedCount;
        
        // Calculate average confidence from extracted data
        const confidenceSum = this.calculateConfidenceSum(extractedData);
        totalConfidence += confidenceSum;

      } catch (error) {
        console.error(`Error processing ${extractionType} with Google AI:`, error);
        throw error;
      }
    }

    return { extractionsCount: totalExtractions, totalConfidence };
  }

  /**
   * Calculate total confidence from extracted data
   */
  private static calculateConfidenceSum(extractedData: any): number {
    let sum = 0;
    let count = 0;

    ['characters', 'relationships', 'plotThreads', 'timelineEvents'].forEach(key => {
      if (extractedData[key] && Array.isArray(extractedData[key])) {
        extractedData[key].forEach((item: any) => {
          if (item.confidence_score) {
            sum += item.confidence_score;
            count++;
          }
        });
      }
    });

    return count > 0 ? sum : 0;
  }

  /**
   * Get existing knowledge for context
   */
  private static async getExistingKnowledge(projectId: string): Promise<any> {
    try {
      const [characters, relationships, plotThreads, timelineEvents] = await Promise.all([
        supabase.from('knowledge_base').select('*').eq('project_id', projectId).eq('category', 'character'),
        supabase.from('character_relationships').select('*').eq('project_id', projectId),
        supabase.from('plot_threads').select('*').eq('project_id', projectId),
        supabase.from('timeline_events').select('*').eq('project_id', projectId)
      ]);

      return {
        characters: characters.data || [],
        relationships: relationships.data || [],
        plotThreads: plotThreads.data || [],
        timelineEvents: timelineEvents.data || []
      };
    } catch (error) {
      console.error('Error getting existing knowledge:', error);
      return {};
    }
  }

  /**
   * Store extracted knowledge in database
   */
  private static async storeExtractedKnowledge(
    extractedData: any,
    projectId: string,
    sourceChunks: SemanticChunk[]
  ): Promise<number> {
    let storedCount = 0;

    try {
      // Store characters
      if (extractedData.characters) {
        for (const character of extractedData.characters) {
          const { error } = await supabase.from('knowledge_base').insert({
            project_id: projectId,
            name: character.name,
            category: 'character',
            description: character.description,
            details: {
              traits: character.traits,
              role: character.role
            },
            confidence_score: character.confidence_score || 0.5,
            extraction_method: 'llm_direct',
            source_chapter_id: sourceChunks[0]?.chapter_id,
            evidence: `Extracted from chunks: ${sourceChunks.map(c => c.id).join(', ')}`
          });

          if (!error) storedCount++;
        }
      }

      // Store relationships
      if (extractedData.relationships) {
        for (const relationship of extractedData.relationships) {
          const { error } = await supabase.from('character_relationships').insert({
            project_id: projectId,
            character_a_name: relationship.character_a_name,
            character_b_name: relationship.character_b_name,
            relationship_type: relationship.relationship_type,
            relationship_strength: relationship.relationship_strength || 5,
            confidence_score: relationship.confidence_score || 0.5,
            extraction_method: 'llm_direct',
            evidence: `Extracted from chunks: ${sourceChunks.map(c => c.id).join(', ')}`
          });

          if (!error) storedCount++;
        }
      }

      // Store plot threads
      if (extractedData.plotThreads) {
        for (const plotThread of extractedData.plotThreads) {
          const { error } = await supabase.from('plot_threads').insert({
            project_id: projectId,
            thread_name: plotThread.thread_name,
            thread_type: plotThread.thread_type,
            key_events: plotThread.key_events || [],
            thread_status: plotThread.status || 'active',
            confidence_score: plotThread.confidence_score || 0.5,
            extraction_method: 'llm_direct',
            evidence: `Extracted from chunks: ${sourceChunks.map(c => c.id).join(', ')}`
          });

          if (!error) storedCount++;
        }
      }

      // Store timeline events
      if (extractedData.timelineEvents) {
        for (const event of extractedData.timelineEvents) {
          const { error } = await supabase.from('timeline_events').insert({
            project_id: projectId,
            event_name: event.event_name,
            event_type: event.event_type,
            event_description: event.description,
            chronological_order: event.chronological_order || 0,
            characters_involved: event.characters_involved || [],
            confidence_score: event.confidence_score || 0.5,
            extraction_method: 'llm_direct',
            evidence: `Extracted from chunks: ${sourceChunks.map(c => c.id).join(', ')}`
          });

          if (!error) storedCount++;
        }
      }

    } catch (error) {
      console.error('Error storing extracted knowledge:', error);
      throw error;
    }

    return storedCount;
  }

  /**
   * Check cross-chapter consistency
   */
  private static async checkCrossChapterConsistency(projectId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('check_cross_chapter_consistency', {
        p_project_id: projectId
      });

      if (error) throw error;
      
      console.log('Cross-chapter consistency check results:', data);
    } catch (error) {
      console.error('Error in consistency check:', error);
      throw error;
    }
  }

  /**
   * Update confidence scores based on cross-validation
   */
  static async updateConfidenceScores(projectId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('update_knowledge_confidence_scores', {
        p_project_id: projectId
      });

      if (error) throw error;
      
      console.log('Confidence scores updated:', data);
    } catch (error) {
      console.error('Error updating confidence scores:', error);
      throw error;
    }
  }
}
