
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/integrations/supabase/client';

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIStreamResponse {
  content: string;
  isComplete: boolean;
}

export class AIClient {
  private static instance: AIClient | null = null;
  private client: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }

  /**
   * Get API key from Supabase secrets
   */
  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    console.log('🔑 Fetching Google AI API key from Supabase secrets...');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-secret', {
        body: { name: 'GOOGLE_AI_API_KEY' }
      });
      
      if (!error && data?.value) {
        console.log('✅ API key retrieved from Supabase secrets');
        this.apiKey = data.value;
        return this.apiKey;
      }
      
      console.error('❌ Failed to retrieve API key from Supabase secrets:', error);
    } catch (error) {
      console.error('❌ Error calling Supabase secrets function:', error);
    }

    throw new Error(
      'Google AI API key not found. Please configure GOOGLE_AI_API_KEY in your Supabase project secrets. ' +
      'Go to your Supabase dashboard > Settings > Edge Functions > Secrets to add the key.'
    );
  }

  /**
   * Get initialized Google AI client
   */
  async getClient(): Promise<GoogleGenAI> {
    if (!this.client) {
      const apiKey = await this.getApiKey();
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Generate content using Google AI
   */
  async generateContent(model: string, contents: string): Promise<AIResponse> {
    const client = await this.getClient();
    
    console.log(`🚀 Making request to Google AI with model ${model}`);
    
    const response = await client.models.generateContent({
      model,
      contents
    });
    
    const content = response.text;
    const usage = undefined; // Usage data structure may be different in new API
    
    console.log(`✅ Google AI response generated successfully`);
    
    return { content, usage };
  }

  /**
   * Reset client instance (useful for testing or key rotation)
   */
  reset(): void {
    this.client = null;
    this.apiKey = null;
  }
}
