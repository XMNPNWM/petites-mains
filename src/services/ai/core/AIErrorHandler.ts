
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;
  private static readonly RATE_LIMIT_DELAY = 2000;

  /**
   * Retry wrapper for AI operations with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'AI operation'
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
    throw new AIError(
      `${context} failed after ${this.MAX_RETRIES} attempts`,
      'MAX_RETRIES_EXCEEDED',
      false,
      lastError || undefined
    );
  }

  /**
   * Handle and classify AI errors
   */
  static handleError(error: unknown, context: string): AIError {
    if (error instanceof AIError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Classify error types
    if (errorMessage.includes('API key')) {
      return new AIError(
        'Invalid or missing API key',
        'INVALID_API_KEY',
        false,
        error instanceof Error ? error : undefined
      );
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return new AIError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        true,
        error instanceof Error ? error : undefined
      );
    }
    
    if (errorMessage.includes('timeout')) {
      return new AIError(
        'Request timeout',
        'TIMEOUT',
        true,
        error instanceof Error ? error : undefined
      );
    }
    
    return new AIError(
      `${context}: ${errorMessage}`,
      'UNKNOWN_ERROR',
      true,
      error instanceof Error ? error : undefined
    );
  }
}
