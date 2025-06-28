
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  private static readonly MODELS = {
    CHAT: 'gemini-2.5-flash',
    ANALYSIS: 'gemini-2.5-flash',
    CONTENT_ENHANCEMENT: 'gemini-1.5-pro',
    EMBEDDINGS: 'text-embedding-004'
  };
  
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

  /**
   * Get API key from Supabase secrets
   */
  private static async getApiKey(): Promise<string> {
    console.log('🔑 Fetching Google AI API key from Supabase secrets...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'GOOGLE_AI_API_KEY' }
      });
      
      if (!error && data?.value) {
        console.log('✅ API key retrieved from Supabase secrets');
        return data.value;
      }
      
      console.error('❌ Failed to retrieve API key from Supabase secrets:', error);
    } catch (error) {
      console.error('❌ Error calling Supabase secrets function:', error);
    }

    // Provide clear error message to guide user
    console.error('❌ Google AI API key not configured in Supabase secrets');
    throw new Error(
      'Google AI API key not found. Please configure GOOGLE_AI_API_KEY in your Supabase project secrets. ' +
      'Go to your Supabase dashboard > Settings > Edge Functions > Secrets to add the key.'
    );
  }

  /**
   * Get Google AI client instance
   */
  private static async getClient(): Promise<GoogleGenerativeAI> {
    const apiKey = await this.getApiKey();
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Retry wrapper for API calls with exponential backoff
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API call'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 ${context} - Attempt ${attempt}/${this.MAX_RETRIES}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ ${context} failed on attempt ${attempt}:`, error);
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          console.log(`⏰ Rate limit detected, using longer delay`);
          const delay = this.RATE_LIMIT_DELAY * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt < this.MAX_RETRIES) {
          // Exponential backoff for other errors
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ ${context} failed after ${this.MAX_RETRIES} attempts`);
    throw new Error(`${context} failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * General purpose chat completion with enhanced error handling
   */
  static async generateChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: string,
    model: string = this.MODELS.CHAT
  ): Promise<GoogleAIResponse> {
    const startTime = Date.now();
    
    return this.withRetry(async () => {
      const genAI = await this.getClient();
      
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

      console.log(`🚀 Making request to Google AI with model ${model}`);
      
      const generativeModel = genAI.getGenerativeModel({ model });
      const result = await generativeModel.generateContent(combinedContent);
      const response = await result.response;
      
      const content = response.text();
      
      // Extract usage metadata if available
      const usage = response.usageMetadata ? {
        inputTokens: response.usageMetadata.promptTokenCount || 0,
        outputTokens: response.usageMetadata.candidatesTokenCount || 0
      } : undefined;

      const processingTime = Date.now() - startTime;
      console.log(`✅ Google AI response generated successfully in ${processingTime}ms. Tokens used: ${usage?.inputTokens || 0} input, ${usage?.outputTokens || 0} output`);
      
      return { content, usage };
    }, `Google AI chat completion (${model})`);
  }

  /**
   * Knowledge extraction and analysis with enhanced error handling
   */
  static async extractKnowledge(
    content: string,
    extractionType: 'characters' | 'relationships' | 'plot_threads' | 'timeline_events' | 'comprehensive',
    existingKnowledge?: any
  ): Promise<any> {
    const startTime = Date.now();
    
    return this.withRetry(async () => {
      console.log(`🔍 Starting knowledge extraction: ${extractionType}, content length: ${content.length} chars`);
      
      // Validate input
      if (!content || content.trim().length === 0) {
        throw new Error('No content provided for knowledge extraction');
      }

      if (content.length > 50000) {
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

      const response = await this.generateChatResponse([
        { role: 'user', content: fullPrompt }
      ], undefined, this.MODELS.ANALYSIS);

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
    return this.withRetry(async () => {
      const genAI = await this.getClient();
      
      // Use the embedding model
      const embeddingModel = genAI.getGenerativeModel({ model });
      const result = await embeddingModel.embedContent(text);
      
      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding generated');
      }

      return result.embedding.values;
    }, `Generate embeddings (${model})`);
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
