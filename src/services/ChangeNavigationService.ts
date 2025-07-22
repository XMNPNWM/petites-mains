
export interface ChangePosition {
  start: number;
  end: number;
  scrollPosition: number;
  relativePosition: number;
}

export interface NavigationState {
  selectedChangeId: string | null;
  highlightedRange: { start: number; end: number } | null;
  originalScrollPosition: number;
  enhancedScrollPosition: number;
}

export class ChangeNavigationService {
  private static navigationState: NavigationState = {
    selectedChangeId: null,
    highlightedRange: null,
    originalScrollPosition: 0,
    enhancedScrollPosition: 0
  };

  /**
   * Calculate scroll position from character position in text
   * Enhanced with better line height estimation
   */
  static calculateScrollPosition(
    text: string, 
    characterPosition: number, 
    containerHeight: number = 400
  ): number {
    if (!text || characterPosition < 0) return 0;
    
    const textBeforePosition = text.substring(0, characterPosition);
    const lines = textBeforePosition.split('\n');
    
    // More accurate line height estimation
    const baseLineHeight = 24; // Base line height in pixels
    const lineSpacing = 1.6; // Line spacing multiplier
    const effectiveLineHeight = baseLineHeight * lineSpacing;
    
    // Calculate scroll position with some padding
    const estimatedScrollPosition = Math.max(0, (lines.length - 1) * effectiveLineHeight);
    const maxScrollHeight = text.split('\n').length * effectiveLineHeight;
    
    return Math.min(estimatedScrollPosition, Math.max(0, maxScrollHeight - containerHeight));
  }

  /**
   * Convert character positions to highlighting range with validation
   */
  static createHighlightRange(startPos: number, endPos: number): { start: number; end: number } {
    const start = Math.max(0, startPos);
    const end = Math.max(start, endPos);
    
    // Ensure the range is valid
    if (end <= start) {
      console.warn('Invalid highlight range:', { startPos, endPos, start, end });
      return { start, end: start + 1 }; // Minimum 1 character range
    }
    
    return { start, end };
  }

  /**
   * Get current navigation state
   */
  static getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Set selected change and calculate positions
   */
  static setSelectedChange(
    changeId: string,
    originalText: string,
    enhancedText: string,
    startPosition: number,
    endPosition: number
  ): NavigationState {
    // Validate positions
    if (startPosition < 0 || endPosition > originalText.length || startPosition >= endPosition) {
      console.warn('Invalid change positions:', {
        changeId,
        startPosition,
        endPosition,
        originalTextLength: originalText.length
      });
      return this.clearSelection();
    }

    const highlightedRange = this.createHighlightRange(startPosition, endPosition);
    const originalScrollPosition = this.calculateScrollPosition(originalText, startPosition);
    const enhancedScrollPosition = this.calculateScrollPosition(enhancedText, startPosition);

    this.navigationState = {
      selectedChangeId: changeId,
      highlightedRange,
      originalScrollPosition,
      enhancedScrollPosition
    };

    console.log('🧭 ChangeNavigationService - Selected change:', {
      changeId,
      highlightedRange,
      originalScrollPosition,
      enhancedScrollPosition,
      textValidation: {
        originalExtract: originalText.substring(startPosition, endPosition),
        extractLength: endPosition - startPosition
      }
    });

    return this.getNavigationState();
  }

  /**
   * Clear navigation state
   */
  static clearSelection(): NavigationState {
    this.navigationState = {
      selectedChangeId: null,
      highlightedRange: null,
      originalScrollPosition: 0,
      enhancedScrollPosition: 0
    };

    console.log('🧭 ChangeNavigationService - Cleared selection');
    return this.getNavigationState();
  }

  /**
   * Check if a change is currently selected
   */
  static isChangeSelected(changeId: string): boolean {
    return this.navigationState.selectedChangeId === changeId;
  }

  /**
   * Enhanced position adjustment after text changes
   * Handles various edge cases and provides better accuracy
   */
  static adjustPositionsAfterChange(
    originalPosition: number,
    changeStart: number,
    changeEnd: number,
    replacementLength: number
  ): number {
    // Position is before the change - no adjustment needed
    if (originalPosition <= changeStart) {
      return originalPosition;
    }
    
    // Position is after the change - adjust by the length difference
    if (originalPosition >= changeEnd) {
      const lengthDifference = replacementLength - (changeEnd - changeStart);
      const newPosition = originalPosition + lengthDifference;
      
      console.log('🔄 Adjusting position after change:', {
        originalPosition,
        changeStart,
        changeEnd,
        replacementLength,
        lengthDifference,
        newPosition
      });
      
      return Math.max(changeStart + replacementLength, newPosition);
    }
    
    // Position is within the changed range
    // Move to the end of the replacement to avoid conflicts
    const newPosition = changeStart + replacementLength;
    
    console.log('🔄 Position within change range, moving to end:', {
      originalPosition,
      changeStart,
      changeEnd,
      replacementLength,
      newPosition
    });
    
    return newPosition;
  }

  /**
   * Validate that a position is valid for the given text
   */
  static validatePosition(text: string, position: number): boolean {
    return position >= 0 && position <= text.length;
  }

  /**
   * Validate that a range is valid for the given text
   */
  static validateRange(text: string, start: number, end: number): boolean {
    return this.validatePosition(text, start) && 
           this.validatePosition(text, end) && 
           start <= end;
  }

  /**
   * Extract text at given range with validation
   */
  static extractTextAtRange(text: string, start: number, end: number): string | null {
    if (!this.validateRange(text, start, end)) {
      console.warn('Invalid range for text extraction:', { start, end, textLength: text.length });
      return null;
    }
    
    return text.substring(start, end);
  }
}
