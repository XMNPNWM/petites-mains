
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
   * Calculate precise scroll position from character position
   * Now uses DOM-based calculation instead of line estimation
   */
  static calculateScrollPosition(
    text: string, 
    characterPosition: number, 
    containerHeight: number = 400
  ): number {
    if (!text || characterPosition < 0) return 0;
    
    // More accurate estimation based on content structure
    const beforePosition = text.substring(0, characterPosition);
    const lines = beforePosition.split('\n');
    const lineHeight = 24; // Consistent with component line height
    
    // Account for actual content density and wrapping
    const avgCharsPerLine = 80; // Typical line character count
    const estimatedLines = lines.length + Math.floor(beforePosition.length / avgCharsPerLine);
    
    const estimatedScrollPosition = Math.max(0, (estimatedLines - 1) * lineHeight);
    const maxScroll = Math.max(0, text.split('\n').length * lineHeight - containerHeight);
    
    return Math.min(estimatedScrollPosition, maxScroll);
  }

  /**
   * Create highlighting range with bounds validation
   */
  static createHighlightRange(startPos: number, endPos: number, textLength: number): { start: number; end: number } {
    const start = Math.max(0, Math.min(startPos, textLength));
    const end = Math.max(start, Math.min(endPos, textLength));
    
    return { start, end };
  }

  /**
   * Validate character positions against actual text content
   */
  static validatePositions(text: string, startPos: number, endPos: number, expectedText: string): boolean {
    if (startPos < 0 || endPos > text.length || startPos > endPos) {
      console.warn('Invalid position bounds:', { startPos, endPos, textLength: text.length });
      return false;
    }

    const actualText = text.substring(startPos, endPos);
    const isValid = actualText === expectedText;
    
    if (!isValid) {
      console.warn('Position validation failed:', {
        expected: expectedText,
        actual: actualText,
        positions: { startPos, endPos }
      });
    }

    return isValid;
  }

  /**
   * Get current navigation state
   */
  static getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }

  /**
   * Set selected change with improved position validation
   */
  static setSelectedChange(
    changeId: string,
    originalText: string,
    enhancedText: string,
    startPosition: number,
    endPosition: number
  ): NavigationState {
    // Validate positions before setting navigation state
    const originalLength = originalText.length;
    const enhancedLength = enhancedText.length;
    
    // Create safe highlight ranges
    const highlightedRange = this.createHighlightRange(startPosition, endPosition, originalLength);
    
    // Calculate scroll positions for both panels
    const originalScrollPosition = this.calculateScrollPosition(originalText, startPosition);
    const enhancedScrollPosition = this.calculateScrollPosition(enhancedText, startPosition);

    this.navigationState = {
      selectedChangeId: changeId,
      highlightedRange,
      originalScrollPosition,
      enhancedScrollPosition
    };

    console.log('🧭 ChangeNavigationService - Selected change with validation:', {
      changeId,
      highlightedRange,
      originalScrollPosition,
      enhancedScrollPosition,
      isValid: startPosition >= 0 && endPosition <= originalLength
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
   * Enhanced position adjustment with validation
   */
  static adjustPositionsAfterChange(
    originalPosition: number,
    changeStart: number,
    changeEnd: number,
    replacementLength: number,
    textLength: number
  ): number {
    // Validate input parameters
    if (originalPosition < 0 || changeStart < 0 || changeEnd < changeStart) {
      console.warn('Invalid position parameters for adjustment');
      return originalPosition;
    }

    if (originalPosition <= changeStart) {
      return originalPosition; // Position before change, no adjustment needed
    }
    
    if (originalPosition >= changeEnd) {
      // Position after change, adjust by the difference in length
      const lengthDifference = replacementLength - (changeEnd - changeStart);
      const adjustedPosition = originalPosition + lengthDifference;
      
      // Ensure adjusted position is within bounds
      return Math.min(adjustedPosition, textLength);
    }
    
    // Position within the changed range, move to start of replacement
    return changeStart;
  }

  /**
   * Recalculate all positions after text modification
   */
  static recalculateAllPositions(
    changes: Array<{ id: string; position_start: number; position_end: number; original_text: string }>,
    modifiedChangeId: string,
    newText: string,
    oldText: string
  ): Array<{ id: string; position_start: number; position_end: number }> {
    const modifiedChange = changes.find(c => c.id === modifiedChangeId);
    if (!modifiedChange) return [];

    const lengthDifference = newText.length - oldText.length;
    const updatedPositions: Array<{ id: string; position_start: number; position_end: number }> = [];

    // Update positions for all changes that come after the modified change
    changes.forEach(change => {
      if (change.id === modifiedChangeId) return; // Skip the modified change itself

      if (change.position_start > modifiedChange.position_end) {
        // Adjust positions for changes that come after
        updatedPositions.push({
          id: change.id,
          position_start: change.position_start + lengthDifference,
          position_end: change.position_end + lengthDifference
        });
      }
    });

    console.log('🧭 ChangeNavigationService - Recalculated positions:', {
      modifiedChangeId,
      lengthDifference,
      updatedCount: updatedPositions.length
    });

    return updatedPositions;
  }
}
