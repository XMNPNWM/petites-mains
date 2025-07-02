
import { GoogleGenerativeAI } from '@google/genai';

class GoogleAIServiceClass {
  private client: GoogleGenerativeAI | null = null;
  private model: any = null;

  private async initialize() {
    if (this.client) return;

    try {
      // Get API key from Supabase edge function
      const response = await fetch('/api/get-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'GOOGLE_AI_API_KEY' })
      });

      if (!response.ok) {
        throw new Error('Failed to get Google AI API key');
      }

      const { value: apiKey } = await response.json();
      
      if (!apiKey) {
        throw new Error('Google AI API key not configured');
      }

      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      
      console.log('Google AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google AI Service:', error);
      throw error;
    }
  }

  async enhanceContent(content: string): Promise<string> {
    try {
      await this.initialize();

      if (!this.model) {
        throw new Error('Google AI model not initialized');
      }

      const prompt = `Please enhance the following text by improving grammar, style, and readability while preserving the original meaning and tone. Make the text more engaging and polished:

${content}

Enhanced version:`;

      const result = await this.model.generateContent([prompt]);
      const response = await result.response;
      const enhancedText = response.text();

      if (!enhancedText || enhancedText.trim().length === 0) {
        throw new Error('Empty response from AI service');
      }

      return enhancedText.trim();
    } catch (error) {
      console.error('Error enhancing content with Google AI:', error);
      throw new Error('Content enhancement failed: ' + (error as Error).message);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return this.model !== null;
    } catch {
      return false;
    }
  }
}

export const GoogleAIService = new GoogleAIServiceClass();
