
import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading for now, use remote models
env.allowRemoteModels = true;
env.allowLocalModels = false;

export interface NamedEntity {
  text: string;
  label: string;
  confidence: number;
  start: number;
  end: number;
}

export interface EntityShift {
  newEntities: NamedEntity[];
  removedEntities: NamedEntity[];
  entityChangeScore: number;
}

export class NERService {
  private static nerPipeline: any = null;
  private static isInitialized = false;

  /**
   * Initialize the NER pipeline
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing NER pipeline...');
      // Use a smaller, faster model for better performance
      this.nerPipeline = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER',
        { 
          revision: 'main',
          quantized: true 
        }
      );
      this.isInitialized = true;
      console.log('NER pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NER pipeline:', error);
      // Fallback to rule-based NER
      this.isInitialized = true;
    }
  }

  /**
   * Extract named entities from text
   */
  static async extractEntities(text: string): Promise<NamedEntity[]> {
    await this.initialize();

    try {
      if (this.nerPipeline) {
        const results = await this.nerPipeline(text);
        return this.processNERResults(results, text);
      } else {
        // Fallback to rule-based entity extraction
        return this.extractEntitiesRuleBased(text);
      }
    } catch (error) {
      console.error('Error in NER extraction:', error);
      // Fallback to rule-based extraction
      return this.extractEntitiesRuleBased(text);
    }
  }

  /**
   * Calculate entity shift between two text segments
   */
  static calculateEntityShift(
    previousEntities: NamedEntity[],
    currentEntities: NamedEntity[]
  ): EntityShift {
    const prevEntityTexts = new Set(previousEntities.map(e => e.text.toLowerCase()));
    const currEntityTexts = new Set(currentEntities.map(e => e.text.toLowerCase()));

    const newEntities = currentEntities.filter(
      entity => !prevEntityTexts.has(entity.text.toLowerCase())
    );

    const removedEntities = previousEntities.filter(
      entity => !currEntityTexts.has(entity.text.toLowerCase())
    );

    // Calculate change score based on entity changes
    const totalEntities = Math.max(previousEntities.length + currentEntities.length, 1);
    const changeScore = (newEntities.length + removedEntities.length) / totalEntities;

    return {
      newEntities,
      removedEntities,
      entityChangeScore: Math.min(changeScore, 1.0)
    };
  }

  /**
   * Process NER pipeline results
   */
  private static processNERResults(results: any[], text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];
    let currentEntity: Partial<NamedEntity> | null = null;

    for (const result of results) {
      const { entity, score, start, end, word } = result;
      
      // Skip low-confidence predictions
      if (score < 0.5) continue;

      const label = entity.replace('B-', '').replace('I-', '');
      
      if (entity.startsWith('B-') || !currentEntity || currentEntity.label !== label) {
        // Start new entity
        if (currentEntity) {
          entities.push(currentEntity as NamedEntity);
        }
        
        currentEntity = {
          text: word,
          label,
          confidence: score,
          start,
          end
        };
      } else if (entity.startsWith('I-') && currentEntity && currentEntity.label === label) {
        // Continue current entity
        currentEntity.text += word;
        currentEntity.end = end;
        currentEntity.confidence = Math.max(currentEntity.confidence!, score);
      }
    }

    if (currentEntity) {
      entities.push(currentEntity as NamedEntity);
    }

    return entities;
  }

  /**
   * Rule-based entity extraction (fallback)
   */
  private static extractEntitiesRuleBased(text: string): NamedEntity[] {
    const entities: NamedEntity[] = [];

    // Character names (capitalized words, often in dialogue)
    const characterPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    let match;

    while ((match = characterPattern.exec(text)) !== null) {
      // Skip common words that aren't names
      const commonWords = ['The', 'This', 'That', 'When', 'Where', 'What', 'Who', 'How', 'Why'];
      if (!commonWords.includes(match[0])) {
        entities.push({
          text: match[0],
          label: 'PERSON',
          confidence: 0.6,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }

    // Locations (often mentioned with prepositions)
    const locationPattern = /(?:in|at|to|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    while ((match = locationPattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        label: 'LOCATION',
        confidence: 0.5,
        start: match.index + match[0].indexOf(match[1]),
        end: match.index + match[0].length
      });
    }

    return entities;
  }

  /**
   * Get entity types from entities list
   */
  static getEntityTypes(entities: NamedEntity[]): string[] {
    return [...new Set(entities.map(entity => entity.label))];
  }

  /**
   * Filter entities by type
   */
  static filterEntitiesByType(entities: NamedEntity[], type: string): NamedEntity[] {
    return entities.filter(entity => entity.label === type);
  }
}
