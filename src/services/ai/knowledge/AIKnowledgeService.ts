
import { AIClient } from '../core/AIClient';
import { AIConfigManager } from '../core/AIConfigManager';
import { AIErrorHandler } from '../core/AIErrorHandler';

export class AIKnowledgeService {
  private static aiClient = AIClient.getInstance();

  /**
   * Extract knowledge from content
   */
  static async extractKnowledge(
    content: string,
    extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive',
    existingKnowledge?: any
  ): Promise<any> {
    const startTime = Date.now();
    
    return AIErrorHandler.withRetry(async () => {
      console.log(`🔍 Starting knowledge extraction: ${extractionType}, content length: ${content.length} chars`);
      
      // Validate input
      if (!content || content.trim().length === 0) {
        throw new Error('No content provided for knowledge extraction');
      }

      if (!AIConfigManager.validateContentLength(content)) {
        console.warn(`⚠️ Content is very long (${content.length} chars), this may take time`);
      }
      
      const prompts = {
        characters: `Analyze the following text and extract character information. Return a JSON object with an array of characters, each having: name, description, traits (array), role, confidence_score (0-1).`,
        relationships: `Analyze the following text and extract character relationships. Return a JSON object with an array of relationships, each having: character_a_name, character_b_name, relationship_type, relationship_strength (1-10), confidence_score (0-1).`,
        plot_threads: `Analyze the following text and extract plot threads. Return a JSON object with an array of plot threads, each having: thread_name, thread_type, key_events (array), status, confidence_score (0-1).`,
        timeline_events: `Analyze the following text and extract timeline events. Return a JSON object with an array of events, each having: event_name, event_type, description, chronological_order, characters_involved (array), confidence_score (0-1).`,
        comprehensive: `Analyze the following text and extract comprehensive knowledge including characters, relationships, plot threads, and timeline events. Return a JSON object with separate arrays for each category: characters, relationships, plotThreads, timelineEvents.`
      };

      const contextPrompt = existingKnowledge ? 
        `\n\nExisting knowledge context: ${JSON.stringify(existingKnowledge, null, 2)}` : '';

      const fullPrompt = `${prompts[extractionType]}${contextPrompt}\n\nText to analyze:\n${content}`;
      const model = AIConfigManager.getModel('analysis');

      const response = await this.aiClient.generateContent(model, fullPrompt);

      // Try to parse JSON response
      try {
        const result = JSON.parse(response.content);
        const processingTime = Date.now() - startTime;
        console.log(`✅ Knowledge extraction completed: ${extractionType} in ${processingTime}ms`);
        
        // Validate the structure
        if (extractionType === 'comprehensive') {
          const validatedResult = {
            characters: Array.isArray(result.characters) ? result.characters : [],
            relationships: Array.isArray(result.relationships) ? result.relationships : [],
            plotThreads: Array.isArray(result.plotThreads) ? result.plotThreads : [],
            timelineEvents: Array.isArray(result.timelineEvents) ? result.timelineEvents : []
          };
          console.log(`📊 Extracted: ${validatedResult.characters.length} chars, ${validatedResult.relationships.length} rels, ${validatedResult.plotThreads.length} plots, ${validatedResult.timelineEvents.length} events`);
          return validatedResult;
        }
        
        return result;
      } catch (parseError) {
        console.error('❌ Failed to parse knowledge extraction response:', parseError);
        console.error('🔍 Raw response:', response.content.substring(0, 500) + '...');
        throw new Error(`Invalid JSON response from knowledge extraction: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }
    }, `Knowledge extraction (${extractionType})`);
  }

  /**
   * Enhance content using AI
   */
  static async enhanceContent(
    originalContent: string,
    enhancementType: 'grammar' | 'style' | 'clarity' | 'engagement' | 'comprehensive',
    userPreferences?: any
  ): Promise<{ content: string; usage?: any }> {
    try {
      const prompts = {
        grammar: 'Improve the grammar, punctuation, and spelling of the following text while maintaining the original meaning and style.',
        style: 'Enhance the writing style of the following text to make it more engaging and polished while preserving the author\'s voice.',
        clarity: 'Improve the clarity and readability of the following text, making complex ideas easier to understand.',
        engagement: 'Enhance the following text to make it more engaging and compelling for readers.',
        comprehensive: 'Comprehensively improve the following text for grammar, style, clarity, and engagement while maintaining the author\'s voice.'
      };

      const preferencesContext = userPreferences ? 
        `\n\nUser preferences: ${JSON.stringify(userPreferences, null, 2)}` : '';

      const fullPrompt = `${prompts[enhancementType]}${preferencesContext}\n\nOriginal text:\n${originalContent}`;
      const model = AIConfigManager.getModel('enhancement');

      const response = await AIErrorHandler.withRetry(
        () => this.aiClient.generateContent(model, fullPrompt),
        `Content enhancement (${enhancementType})`
      );

      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error enhancing content:', error);
      throw AIErrorHandler.handleError(error, 'Content enhancement');
    }
  }

  /**
   * Batch processing for multiple texts
   */
  static async batchProcessTexts(
    texts: string[],
    operation: 'extract' | 'enhance',
    options?: any
  ): Promise<any[]> {
    const results = [];
    const maxBatchSize = AIConfigManager.CONTENT_LIMITS.MAX_BATCH_SIZE;
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < texts.length; i += maxBatchSize) {
      const batch = texts.slice(i, i + maxBatchSize);
      
      for (const text of batch) {
        try {
          let result;
          switch (operation) {
            case 'extract':
              result = await this.extractKnowledge(
                text, 
                options?.extractionType || 'comprehensive', 
                options?.existingKnowledge
              );
              break;
            case 'enhance':
              result = await this.enhanceContent(
                text, 
                options?.enhancementType || 'comprehensive', 
                options?.userPreferences
              );
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          results.push({ success: true, data: result });
        } catch (error) {
          console.error(`Error processing text in batch:`, error);
          const aiError = AIErrorHandler.handleError(error, `Batch ${operation}`);
          results.push({ success: false, error: aiError.message });
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}
