
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
   * True DOM-based scroll position calculation using actual DOM measurements
   * This completely replaces the line estimation approach
   */
  static calculateDOMBasedScrollPosition(
    text: string, 
    characterPosition: number, 
    containerHeight: number = 400
  ): number {
    if (!text || characterPosition < 0) return 0;
    
    console.log('🧭 ChangeNavigationService: Calculating DOM-based scroll position for char:', characterPosition);
    
    // Create a temporary DOM element that matches the actual display
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.6';
    tempDiv.style.fontFamily = 'inherit';
    tempDiv.style.width = '800px'; // Approximate content width
    tempDiv.style.padding = '16px'; // Match actual padding
    
    // Add the text up to the character position
    const textBeforePosition = text.substring(0, characterPosition);
    tempDiv.textContent = textBeforePosition;
    
    document.body.appendChild(tempDiv);
    
    // Measure the actual height
    const measuredHeight = tempDiv.offsetHeight;
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    // Return the measured scroll position with offset for visibility
    const scrollPosition = Math.max(0, measuredHeight - (containerHeight / 3));
    
    console.log('🧭 ChangeNavigationService: DOM-based calculation result:', {
      characterPosition,
      textLength: textBeforePosition.length,
      measuredHeight,
      scrollPosition,
      containerOffset: containerHeight / 3
    });
    
    return scrollPosition;
  }

  /**
   * Enhanced range-based scroll position calculation for DOM elements
   * This is used when we have access to the actual DOM container
   */
  static calculateScrollPositionWithRange(
    containerElement: HTMLElement,
    characterPosition: number
  ): number {
    if (!containerElement) {
      console.warn('🧭 ChangeNavigationService: No container element provided for range calculation');
      return 0;
    }
    
    console.log('🧭 ChangeNavigationService: Calculating range-based scroll position for char:', characterPosition);
    
    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPos = 0;
    let node;
    const range = document.createRange();

    while (node = walker.nextNode()) {
      const textNode = node as Text;
      const nodeLength = textNode.textContent?.length || 0;
      
      if (currentPos + nodeLength >= characterPosition) {
        // Found the target text node
        const offsetInNode = characterPosition - currentPos;
        try {
          range.setStart(textNode, Math.min(offsetInNode, nodeLength));
          range.setEnd(textNode, Math.min(offsetInNode, nodeLength));
          
          const rect = range.getBoundingClientRect();
          const containerRect = containerElement.getBoundingClientRect();
          
          const scrollPosition = rect.top - containerRect.top + containerElement.scrollTop;
          
          console.log('🧭 ChangeNavigationService: Range-based calculation result:', {
            characterPosition,
            offsetInNode,
            rectTop: rect.top,
            containerTop: containerRect.top,
            containerScrollTop: containerElement.scrollTop,
            scrollPosition
          });
          
          return scrollPosition;
        } catch (e) {
          console.warn('Range creation failed:', e);
          return 0;
        }
      }
      
      currentPos += nodeLength;
    }

    console.warn('🧭 ChangeNavigationService: Character position not found in DOM');
    return 0;
  }

  /**
   * Create highlighting range with bounds validation
   */
  static createHighlightRange(startPos: number, endPos: number, textLength: number): { start: number; end: number } {
    const start = Math.max(0, Math.min(startPos, textLength));
    const end = Math.max(start, Math.min(endPos, textLength));
    
    console.log('🧭 ChangeNavigationService: Created highlight range:', {
      originalStart: startPos,
      originalEnd: endPos,
      adjustedStart: start,
      adjustedEnd: end,
      textLength
    });
    
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
        expected: expectedText.substring(0, 100) + (expectedText.length > 100 ? '...' : ''),
        actual: actualText.substring(0, 100) + (actualText.length > 100 ? '...' : ''),
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
   * Set selected change with improved position validation and true DOM-based calculation
   */
  static setSelectedChange(
    changeId: string,
    originalText: string,
    enhancedText: string,
    startPosition: number,
    endPosition: number
  ): NavigationState {
    console.log('🧭 ChangeNavigationService: Setting selected change:', {
      changeId,
      startPosition,
      endPosition,
      originalTextLength: originalText.length,
      enhancedTextLength: enhancedText.length
    });

    // Validate positions before setting navigation state
    const originalLength = originalText.length;
    const enhancedLength = enhancedText.length;
    
    // Create safe highlight ranges
    const highlightedRange = this.createHighlightRange(startPosition, endPosition, originalLength);
    
    // Calculate scroll positions using true DOM-based measurement for both panels
    const originalScrollPosition = this.calculateDOMBasedScrollPosition(originalText, startPosition);
    const enhancedScrollPosition = this.calculateDOMBasedScrollPosition(enhancedText, startPosition);

    this.navigationState = {
      selectedChangeId: changeId,
      highlightedRange,
      originalScrollPosition,
      enhancedScrollPosition
    };

    console.log('🧭 ChangeNavigationService: Navigation state updated:', {
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
    console.log('🧭 ChangeNavigationService: Clearing selection');
    
    this.navigationState = {
      selectedChangeId: null,
      highlightedRange: null,
      originalScrollPosition: 0,
      enhancedScrollPosition: 0
    };

    return this.getNavigationState();
  }

  /**
   * Check if a change is currently selected
   */
  static isChangeSelected(changeId: string): boolean {
    const isSelected = this.navigationState.selectedChangeId === changeId;
    console.log('🧭 ChangeNavigationService: Checking if change selected:', changeId, isSelected);
    return isSelected;
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

    let adjustedPosition = originalPosition;

    if (originalPosition <= changeStart) {
      adjustedPosition = originalPosition; // Position before change, no adjustment needed
    } else if (originalPosition >= changeEnd) {
      // Position after change, adjust by the difference in length
      const lengthDifference = replacementLength - (changeEnd - changeStart);
      adjustedPosition = originalPosition + lengthDifference;
      
      // Ensure adjusted position is within bounds
      adjustedPosition = Math.min(adjustedPosition, textLength);
    } else {
      // Position within the changed range, move to start of replacement
      adjustedPosition = changeStart;
    }

    console.log('🧭 ChangeNavigationService: Position adjusted:', {
      originalPosition,
      changeStart,
      changeEnd,
      replacementLength,
      adjustedPosition
    });

    return adjustedPosition;
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

    console.log('🧭 ChangeNavigationService: Recalculating positions after change:', {
      modifiedChangeId,
      lengthDifference,
      totalChanges: changes.length
    });

    // Update positions for all changes that come after the modified change
    changes.forEach(change => {
      if (change.id === modifiedChangeId) return; // Skip the modified change itself

      if (change.position_start > modifiedChange.position_end) {
        // Adjust positions for changes that come after
        const updatedChange = {
          id: change.id,
          position_start: change.position_start + lengthDifference,
          position_end: change.position_end + lengthDifference
        };
        
        updatedPositions.push(updatedChange);
        
        console.log('🧭 ChangeNavigationService: Updated change position:', {
          changeId: change.id,
          oldStart: change.position_start,
          oldEnd: change.position_end,
          newStart: updatedChange.position_start,
          newEnd: updatedChange.position_end
        });
      }
    });

    console.log('🧭 ChangeNavigationService: Position recalculation complete:', {
      modifiedChangeId,
      lengthDifference,
      updatedCount: updatedPositions.length
    });

    return updatedPositions;
  }
}
