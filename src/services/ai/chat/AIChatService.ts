
import { AIClient } from '../core/AIClient';
import { AIConfigManager } from '../core/AIConfigManager';
import { AIErrorHandler } from '../core/AIErrorHandler';
import { ChapterContextService, ChapterContext } from '../../ChapterContextService';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIChatResponse {
  content: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class AIChatService {
  private static aiClient = AIClient.getInstance();

  /**
   * Generate chat response with project context
   */
  static async generateResponse(
    message: string, 
    projectId: string, 
    conversationHistory: AIMessage[] = [],
    chapterId?: string
  ): Promise<AIChatResponse> {
    try {
      console.log('Generating AI chat response for project:', projectId);
      
      // Load project context
      const chapters = await ChapterContextService.getProjectChapters(projectId);
      const contextSummary = ChapterContextService.getContextSummary(chapters);
      
      // Build context for AI
      const fullContext = `Project: ${contextSummary}`;
      
      // Format conversation history for Google AI
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful AI writing assistant. Use the provided project context to give relevant, insightful responses about the story and characters.'
        },
        ...conversationHistory,
        {
          role: 'user' as const,
          content: message
        }
      ];

      const combinedContent = this.formatMessagesForAI(messages, fullContext);
      const model = AIConfigManager.getModel('chat');

      const response = await AIErrorHandler.withRetry(
        () => this.aiClient.generateContent(model, combinedContent),
        'AI chat generation'
      );
      
      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      const aiError = AIErrorHandler.handleError(error, 'Chat generation');
      
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        error: aiError.message
      };
    }
  }

  /**
   * Generate context-aware response for specific knowledge domains
   */
  static async generateKnowledgeResponse(
    message: string,
    projectId: string,
    domain: 'characters' | 'plot' | 'worldbuilding' | 'general',
    conversationHistory: AIMessage[] = []
  ): Promise<AIChatResponse> {
    try {
      const systemPrompts = {
        characters: 'You are a character development expert. Help with character analysis, development, and relationships.',
        plot: 'You are a plot structure expert. Help with story arcs, pacing, and narrative development.',
        worldbuilding: 'You are a worldbuilding expert. Help with settings, cultures, and story world consistency.',
        general: 'You are a general writing assistant. Provide helpful insights about the story.'
      };

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompts[domain]
        },
        ...conversationHistory,
        {
          role: 'user' as const,
          content: message
        }
      ];

      const combinedContent = this.formatMessagesForAI(messages);
      const model = AIConfigManager.getModel('chat');

      const response = await AIErrorHandler.withRetry(
        () => this.aiClient.generateContent(model, combinedContent),
        `AI ${domain} response generation`
      );
      
      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating knowledge response:', error);
      const aiError = AIErrorHandler.handleError(error, 'Knowledge response generation');
      
      return {
        content: "I'm sorry, I'm having trouble accessing the knowledge base right now. Please try again.",
        error: aiError.message
      };
    }
  }

  /**
   * Format messages for AI consumption
   */
  private static formatMessagesForAI(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: string
  ): string {
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

    return combinedContent;
  }
}
