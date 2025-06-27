
import { ChapterContextService, ChapterContext } from './ChapterContextService';
import { GoogleAIService } from './GoogleAIService';
import { KnowledgeExtractionService } from './KnowledgeExtractionService';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  content: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class AIService {
  static async generateResponse(
    message: string, 
    projectId: string, 
    conversationHistory: AIMessage[] = [],
    chapterId?: string
  ): Promise<AIResponse> {
    try {
      console.log('Generating AI response for project:', projectId);
      
      // Load project context
      const chapters = await ChapterContextService.getProjectChapters(projectId);
      const contextSummary = ChapterContextService.getContextSummary(chapters);
      
      // Get relevant knowledge context
      let knowledgeContext = '';
      try {
        const knowledge = await KnowledgeExtractionService.getProjectKnowledge(projectId);
        if (knowledge.length > 0) {
          knowledgeContext = `\n\nProject Knowledge:\n${knowledge.map(k => 
            `- ${k.name} (${k.category}): ${k.description}`
          ).join('\n')}`;
        }
      } catch (error) {
        console.warn('Failed to load knowledge context:', error);
      }

      // Build context for AI
      const fullContext = `Project: ${contextSummary}${knowledgeContext}`;
      
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

      const response = await GoogleAIService.generateChatResponse(messages, fullContext);
      
      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
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
  ): Promise<AIResponse> {
    try {
      // Get domain-specific knowledge
      let domainContext = '';
      const knowledge = await KnowledgeExtractionService.getProjectKnowledge(projectId);
      
      const domainKnowledge = knowledge.filter(k => {
        switch (domain) {
          case 'characters':
            return k.category === 'character';
          case 'plot':
            return ['plot_point', 'theme'].includes(k.category);
          case 'worldbuilding':
            return ['world_building', 'setting'].includes(k.category);
          default:
            return true;
        }
      });

      if (domainKnowledge.length > 0) {
        domainContext = `\nRelevant ${domain} knowledge:\n${domainKnowledge.map(k => 
          `- ${k.name}: ${k.description} (confidence: ${Math.round(k.confidence_score * 100)}%)`
        ).join('\n')}`;
      }

      const systemPrompt = {
        characters: 'You are a character development expert. Help with character analysis, development, and relationships.',
        plot: 'You are a plot structure expert. Help with story arcs, pacing, and narrative development.',
        worldbuilding: 'You are a worldbuilding expert. Help with settings, cultures, and story world consistency.',
        general: 'You are a general writing assistant. Provide helpful insights about the story.'
      };

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt[domain]
        },
        ...conversationHistory,
        {
          role: 'user' as const,
          content: message
        }
      ];

      const response = await GoogleAIService.generateChatResponse(messages, domainContext);
      
      return {
        content: response.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('Error generating knowledge response:', error);
      return {
        content: "I'm sorry, I'm having trouble accessing the knowledge base right now. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
