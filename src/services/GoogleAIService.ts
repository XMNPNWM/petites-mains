
import { GoogleGenerativeAI } from '@google/generative-ai';

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
      this.model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
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

  async extractKnowledge(content: string, extractionType: string, existingKnowledge: any): Promise<any> {
    try {
      await this.initialize();

      if (!this.model) {
        throw new Error('Google AI model not initialized');
      }

      const prompt = `Analyze the following text and extract knowledge in JSON format for ${extractionType}:

${content}

Based on existing knowledge context:
${JSON.stringify(existingKnowledge, null, 2)}

Please return a JSON object with the following structure:
{
  "characters": [{"name": "", "description": "", "traits": [], "role": "", "confidence_score": 0.8}],
  "relationships": [{"character_a_name": "", "character_b_name": "", "relationship_type": "", "relationship_strength": 5, "confidence_score": 0.8}],
  "plotThreads": [{"thread_name": "", "thread_type": "", "key_events": [], "status": "active", "confidence_score": 0.8}],
  "timelineEvents": [{"event_name": "", "event_type": "", "description": "", "chronological_order": 0, "characters_involved": [], "confidence_score": 0.8}]
}`;

      const result = await this.model.generateContent([prompt]);
      const response = await result.response;
      const extractedText = response.text();

      // Try to parse JSON response
      try {
        const cleanedText = extractedText.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanedText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        return {
          characters: [],
          relationships: [],
          plotThreads: [],
          timelineEvents: []
        };
      }
    } catch (error) {
      console.error('Error extracting knowledge with Google AI:', error);
      throw new Error('Knowledge extraction failed: ' + (error as Error).message);
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
