
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
   */
  static calculateScrollPosition(
    text: string, 
    characterPosition: number, 
    containerHeight: number = 400
  ): number {
    if (!text || characterPosition < 0) return 0;
    
    const textBeforePosition = text.substring(0, characterPosition);
    const lines = textBeforePosition.split('\n');
    const lineHeight = 24; // Approximate line height in pixels
    const estimatedScrollPosition = Math.max(0, (lines.length - 1) * lineHeight);
    
    return Math.min(estimatedScrollPosition, text.split('\n').length * lineHeight - containerHeight);
  }

  /**
   * Convert character positions to highlighting range
   */
  static createHighlightRange(startPos: number, endPos: number): { start: number; end: number } {
    return {
      start: Math.max(0, startPos),
      end: Math.max(startPos, endPos)
    };
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
      enhancedScrollPosition
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
   * Calculate position adjustments after text changes
   */
  static adjustPositionsAfterChange(
    originalPosition: number,
    changeStart: number,
    changeEnd: number,
    replacementLength: number
  ): number {
    if (originalPosition <= changeStart) {
      return originalPosition; // Position before change, no adjustment needed
    }
    
    if (originalPosition >= changeEnd) {
      // Position after change, adjust by the difference in length
      const lengthDifference = replacementLength - (changeEnd - changeStart);
      return originalPosition + lengthDifference;
    }
    
    // Position within the changed range, move to start of replacement
    return changeStart;
  }
}
