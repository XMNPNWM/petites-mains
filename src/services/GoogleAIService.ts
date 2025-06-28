import { AIClient } from './ai/core/AIClient';
import { AIConfigManager } from './ai/core/AIConfigManager';
import { AIErrorHandler } from './ai/core/AIErrorHandler';

// Re-export types for backward compatibility
export interface GoogleAIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface GoogleAIStreamResponse {
  content: string;
  isComplete: boolean;
}

/**
 * Legacy GoogleAIService - now acts as a facade over the new AI architecture
 * @deprecated Use AIChatService or AIKnowledgeService directly
 */
export class GoogleAIService {
  private static aiClient = AIClient.getInstance();

  // Keep model constants for backward compatibility
  static readonly MODELS = AIConfigManager.MODELS;

  /**
   * @deprecated Use AIChatService.generateResponse instead
   */
  static async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: string,
    model: string = AIConfigManager.MODELS.CHAT
  ): Promise<GoogleAIResponse> {
    console.warn('⚠️ GoogleAIService.generateChatResponse is deprecated. Use AIChatService.generateResponse instead.');
    
    return AIErrorHandler.withRetry(async () => {
      // Validate input
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided for chat completion');
      }

      // Format messages for Gemini API - combine all messages into a single prompt
      let combinedContent = '';
      
      // Add context if provided
      if (context) {
        combinedContent += `Context: ${context}\n\n`;
      }
      
      // Add system message if present
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedContent += `Instructions: ${systemMessage.content}\n\n`;
      }
      
      // Add conversation history
      messages.filter(msg => msg.role !== 'system').forEach(msg => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
        combinedContent += `${roleLabel}: ${msg.content}\n\n`;
      });

      const response = await this.aiClient.generateContent(model, combinedContent);
      
      return { content: response.content, usage: response.usage };
    }, `Google AI chat completion (${model})`);
  }

  /**
   * @deprecated Use AIKnowledgeService.extractKnowledge instead
   */
  static async extractKnowledge(
    content: string,
    extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive',
    existingKnowledge?: any
  ): Promise<any> {
    console.warn('⚠️ GoogleAIService.extractKnowledge is deprecated. Use AIKnowledgeService.extractKnowledge instead.');
    
    // Import here to avoid circular dependency
    const { AIKnowledgeService } = await import('./ai/knowledge/AIKnowledgeService');
    return AIKnowledgeService.extractKnowledge(content, extractionType, existingKnowledge);
  }

  /**
   * @deprecated Use AIKnowledgeService.enhanceContent instead
   */
  static async enhanceContent(
    originalContent: string,
    enhancementType: 'grammar' | 'style' | 'clarity' | 'engagement' | 'comprehensive',
    userPreferences?: any
  ): Promise<GoogleAIResponse> {
    console.warn('⚠️ GoogleAIService.enhanceContent is deprecated. Use AIKnowledgeService.enhanceContent instead.');
    
    // Import here to avoid circular dependency
    const { AIKnowledgeService } = await import('./ai/knowledge/AIKnowledgeService');
    const result = await AIKnowledgeService.enhanceContent(originalContent, enhancementType, userPreferences);
    
    return { content: result.content, usage: result.usage };
  }

  /**
   * @deprecated Embeddings generation needs to be updated for the new @google/genai package
   */
  static async generateEmbeddings(
    text: string,
    model: string = AIConfigManager.MODELS.EMBEDDINGS
  ): Promise<number[]> {
    console.warn('⚠️ Embeddings API may need different implementation with new @google/genai package');
    throw new Error('Embeddings generation needs to be updated for the new @google/genai package');
  }

  /**
   * @deprecated Use AIKnowledgeService.batchProcessTexts instead
   */
  static async batchProcessTexts(
    texts: string[],
    operation: 'extract' | 'enhance' | 'embed',
    options?: any
  ): Promise<any[]> {
    console.warn('⚠️ GoogleAIService.batchProcessTexts is deprecated. Use AIKnowledgeService.batchProcessTexts instead.');
    
    if (operation === 'embed') {
      throw new Error('Embeddings generation is not yet supported');
    }

    // Import here to avoid circular dependency
    const { AIKnowledgeService } = await import('./ai/knowledge/AIKnowledgeService');
    return AIKnowledgeService.batchProcessTexts(texts, operation, options);
  }
}
