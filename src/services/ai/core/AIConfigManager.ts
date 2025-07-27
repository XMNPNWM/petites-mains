
export class AIConfigManager {
  static readonly MODELS = {
    CHAT: 'gemini-2.5-flash',
    ANALYSIS: 'gemini-2.5-flash',
    CONTENT_ENHANCEMENT: 'gemini-1.5-pro',
    EMBEDDINGS: 'text-embedding-004'
  };
  
  static readonly RATE_LIMITS = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    RATE_LIMIT_DELAY: 2000, // 2 seconds between requests
  };

  static readonly CONTENT_LIMITS = {
    MAX_CONTENT_LENGTH: 50000,
    MAX_BATCH_SIZE: 10,
  };

  /**
   * Get model for specific AI operation
   */
  static getModel(operation: 'chat' | 'analysis' | 'enhancement' | 'embeddings'): string {
    switch (operation) {
      case 'chat':
        return this.MODELS.CHAT;
      case 'analysis':
        return this.MODELS.ANALYSIS;
      case 'enhancement':
        return this.MODELS.CONTENT_ENHANCEMENT;
      case 'embeddings':
        return this.MODELS.EMBEDDINGS;
      default:
        return this.MODELS.CHAT;
    }
  }

  /**
   * Validate content length
   */
  static validateContentLength(content: string): boolean {
    return content.length <= this.CONTENT_LIMITS.MAX_CONTENT_LENGTH;
  }

  /**
   * Get retry configuration
   */
  static getRetryConfig() {
    return {
      maxRetries: this.RATE_LIMITS.MAX_RETRIES,
      retryDelay: this.RATE_LIMITS.RETRY_DELAY,
      rateLimitDelay: this.RATE_LIMITS.RATE_LIMIT_DELAY,
    };
  }
}
