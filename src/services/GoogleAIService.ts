
import { supabase } from '@/integrations/supabase/client';

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

export class GoogleAIService {
  private static readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  private static readonly MODELS = {
    CHAT: 'gemini-2.0-flash-exp',
    ANALYSIS: 'gemini-1.5-pro',
    CONTENT_ENHANCEMENT: 'gemini-1.5-pro',
    EMBEDDINGS: 'text-embedding-004'
  };

  /**
   * Get API key from Supabase secrets
   */
  private static async getApiKey(): Promise<string> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured');
    }
    return apiKey;
  }

  /**
   * General purpose chat completion
   */
  static async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: string,
    model: string = this.MODELS.CHAT
  ): Promise<GoogleAIResponse> {
    try {
      const apiKey = await this.getApiKey();
      
      // Format messages for Gemini API
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add context as system instruction if provided
      const systemInstruction = context ? {
        role: 'user',
        parts: [{ text: `Context: ${context}\n\nPlease use this context to provide more accurate and relevant responses.` }]
      } : null;

      const requestBody = {
        contents: systemInstruction ? [systemInstruction, ...formattedMessages] : formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      const response = await fetch(`${this.BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated');
      }

      const content = data.candidates[0].content.parts[0].text;
      const usage = data.usageMetadata ? {
        inputTokens: data.usageMetadata.promptTokenCount || 0,
        outputTokens: data.usageMetadata.candidatesTokenCount || 0
      } : undefined;

      return { content, usage };
    } catch (error) {
      console.error('Error generating chat response:', error);
      throw error;
    }
  }

  /**
   * Knowledge extraction and analysis
   */
  static async extractKnowledge(
    content: string,
    extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive',
    existingKnowledge?: any
  ): Promise<any> {
    try {
      const prompts = {
        characters: `Analyze the following text and extract character information. Return a JSON object with an array of characters, each having: name, description, traits (array), role, confidence_score (0-1).`,
        relationships: `Analyze the following text and extract character relationships. Return a JSON object with an array of relationships, each having: character_a_name, character_b_name, relationship_type, relationship_strength (1-10), confidence_score (0-1).`,
        plot_threads: `Analyze the following text and extract plot threads. Return a JSON object with an array of plot threads, each having: thread_name, thread_type, key_events (array), status, confidence_score (0-1).`,
        timeline_events: `Analyze the following text and extract timeline events. Return a JSON object with an array of events, each having: event_name, event_type, description, chronological_order, characters_involved (array), confidence_score (0-1).`,
        comprehensive: `Analyze the following text and extract comprehensive knowledge including characters, relationships, plot threads, and timeline events. Return a JSON object with separate arrays for each category.`
      };

      const contextPrompt = existingKnowledge ? 
        `\n\nExisting knowledge context: ${JSON.stringify(existingKnowledge, null, 2)}` : '';

      const fullPrompt = `${prompts[extractionType]}${contextPrompt}\n\nText to analyze:\n${content}`;

      const response = await this.generateChatResponse([
        { role: 'user', content: fullPrompt }
      ], undefined, this.MODELS.ANALYSIS);

      // Try to parse JSON response
      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        console.error('Failed to parse knowledge extraction response:', parseError);
        throw new Error('Invalid JSON response from knowledge extraction');
      }
    } catch (error) {
      console.error('Error extracting knowledge:', error);
      throw error;
    }
  }

  /**
   * Content enhancement
   */
  static async enhanceContent(
    originalContent: string,
    enhancementType: 'grammar' | 'style' | 'clarity' | 'engagement' | 'comprehensive',
    userPreferences?: any
  ): Promise<GoogleAIResponse> {
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

      return await this.generateChatResponse([
        { role: 'user', content: fullPrompt }
      ], undefined, this.MODELS.CONTENT_ENHANCEMENT);
    } catch (error) {
      console.error('Error enhancing content:', error);
      throw error;
    }
  }
}
