
import { AIChatService, AIMessage, AIChatResponse } from './ai/chat/AIChatService';
import { KnowledgeExtractionService } from './KnowledgeExtractionService';

// Re-export types for backward compatibility
export { AIMessage, AIChatResponse as AIResponse };

/**
 * Legacy AIService - now acts as a facade over the new AI architecture
 * @deprecated Use AIChatService directly
 */
export class AIService {
  /**
   * @deprecated Use AIChatService.generateResponse instead
   */
  static async generateResponse(
    message: string, 
    projectId: string, 
    conversationHistory: AIMessage[] = [],
    chapterId?: string
  ): Promise<AIChatResponse> {
    console.warn('⚠️ AIService.generateResponse is deprecated. Use AIChatService.generateResponse instead.');
    return AIChatService.generateResponse(message, projectId, conversationHistory, chapterId);
  }

  /**
   * @deprecated Use AIChatService.generateKnowledgeResponse instead
   */
  static async generateKnowledgeResponse(
    message: string,
    projectId: string,
    domain: 'characters' | 'plot' | 'worldbuilding' | 'general',
    conversationHistory: AIMessage[] = []
  ): Promise<AIChatResponse> {
    console.warn('⚠️ AIService.generateKnowledgeResponse is deprecated. Use AIChatService.generateKnowledgeResponse instead.');
    return AIChatService.generateKnowledgeResponse(message, projectId, domain, conversationHistory);
  }
}
