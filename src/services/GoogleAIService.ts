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
    CHAT: 'gemini-2.5-flash-lite',
    ANALYSIS: 'gemini-2.5-flash',
    CONTENT_ENHANCEMENT: 'gemini-1.5-pro',
    EMBEDDINGS: 'text-embedding-004'
  };
  
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Get API key from environment
   */
  private static async getApiKey(): Promise<string> {
    // Try to get from Supabase secrets first
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'GOOGLE_AI_API_KEY' }
      });
      
      if (!error && data?.value) {
        return data.value;
      }
    } catch (error) {
      console.warn('Could not fetch API key from Supabase secrets:', error);
    }

    // Fallback to environment variable
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Google AI API key not configured. Please add GOOGLE_AI_API_KEY to your environment or Supabase secrets.');
    }
    return apiKey;
  }

  /**
   * Retry wrapper for API calls
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API call'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`${context} - Attempt ${attempt}/${this.MAX_RETRIES}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${context} failed on attempt ${attempt}:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * attempt;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * General purpose chat completion
   */
  static async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: string,
    model: string = this.MODELS.CHAT
  ): Promise<GoogleAIResponse> {
    return this.withRetry(async () => {
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

      console.log(`Making request to Google AI with model ${model}`);
      
      const response = await fetch(`${this.BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated from Google AI');
      }

      const content = data.candidates[0].content.parts[0].text;
      const usage = data.usageMetadata ? {
        inputTokens: data.usageMetadata.promptTokenCount || 0,
        outputTokens: data.usageMetadata.candidatesTokenCount || 0
      } : undefined;

      console.log(`Google AI response generated successfully. Tokens used: ${usage?.inputTokens || 0} input, ${usage?.outputTokens || 0} output`);
      
      return { content, usage };
    }, 'Google AI chat completion');
  }

  /**
   * Knowledge extraction and analysis using gemini-2.5-flash
   */
  static async extractKnowledge(
    content: string,
    extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive',
    existingKnowledge?: any
  ): Promise<any> {
    return this.withRetry(async () => {
      console.log(`Starting knowledge extraction: ${extractionType}, content length: ${content.length} chars`);
      
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
        const result = JSON.parse(response.content);
        console.log(`Knowledge extraction completed: ${extractionType}`);
        return result;
      } catch (parseError) {
        console.error('Failed to parse knowledge extraction response:', parseError);
        console.error('Raw response:', response.content);
        throw new Error('Invalid JSON response from knowledge extraction');
      }
    }, `Knowledge extraction (${extractionType})`);
  }

  /**
   * Content enhancement using gemini-1.5-pro
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

  /**
   * Generate embeddings for semantic similarity
   */
  static async generateEmbeddings(
    text: string,
    model: string = this.MODELS.EMBEDDINGS
  ): Promise<number[]> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`${this.BASE_URL}/models/${model}:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: {
            parts: [{ text }]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google AI Embeddings API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !data.embedding.values) {
        throw new Error('No embedding generated');
      }

      return data.embedding.values;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Batch processing for multiple texts
   */
  static async batchProcessTexts(
    texts: string[],
    operation: 'extract' | 'enhance' | 'embed',
    options?: any
  ): Promise<any[]> {
    const results = [];
    
    for (const text of texts) {
      try {
        let result;
        switch (operation) {
          case 'extract':
            result = await this.extractKnowledge(text, options?.extractionType || 'comprehensive', options?.existingKnowledge);
            break;
          case 'enhance':
            result = await this.enhanceContent(text, options?.enhancementType || 'comprehensive', options?.userPreferences);
            break;
          case 'embed':
            result = await this.generateEmbeddings(text);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        results.push({ success: true, data: result });
      } catch (error) {
        console.error(`Error processing text in batch:`, error);
        results.push({ success: false, error: error.message });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}
