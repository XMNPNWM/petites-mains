
/**
 * Service for handling change navigation and position mapping
 */

interface ChangePosition {
  start: number;
  end: number;
  scrollTop: number;
  elementHeight: number;
}

interface AIChange {
  id: string;
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  confidence_score: number;
}

export class ChangeNavigationService {
  
  /**
   * Calculate scroll position for a given character position in text
   */
  static calculateScrollPosition(
    text: string,
    characterPosition: number,
    containerElement: HTMLElement | null
  ): number {
    if (!containerElement || !text) return 0;

    // Create a temporary element to measure text position
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.font = window.getComputedStyle(containerElement).font;
    tempDiv.style.lineHeight = window.getComputedStyle(containerElement).lineHeight;
    tempDiv.style.width = containerElement.clientWidth + 'px';
    
    document.body.appendChild(tempDiv);
    
    try {
      // Insert text up to the character position
      const textBeforePosition = text.substring(0, characterPosition);
      tempDiv.textContent = textBeforePosition;
      
      // Get the height to determine scroll position
      const height = tempDiv.offsetHeight;
      
      // Calculate scroll position with some offset for better visibility
      const scrollOffset = Math.max(0, height - 100); // 100px offset from top
      
      return scrollOffset;
    } finally {
      // Safely remove the temp element
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    }
  }

  /**
   * Map change position to both original and enhanced content positions
   */
  static mapChangePositions(
    change: AIChange,
    originalContent: string,
    enhancedContent: string
  ): {
    original: ChangePosition;
    enhanced: ChangePosition;
  } {
    return {
      original: {
        start: change.position_start,
        end: change.position_end,
        scrollTop: 0, // Will be calculated when needed
        elementHeight: change.original_text.length
      },
      enhanced: {
        start: change.position_start,
        end: change.position_start + change.enhanced_text.length,
        scrollTop: 0, // Will be calculated when needed  
        elementHeight: change.enhanced_text.length
      }
    };
  }

  /**
   * Create highlighted range for visual indication
   */
  static createHighlightedRange(change: AIChange): { start: number; end: number } {
    return {
      start: change.position_start,
      end: change.position_end
    };
  }

  /**
   * Calculate position adjustments after a change is rejected
   */
  static calculatePositionAdjustments(
    rejectedChange: AIChange,
    allChanges: AIChange[]
  ): Array<{ changeId: string; newStart: number; newEnd: number }> {
    const adjustments: Array<{ changeId: string; newStart: number; newEnd: number }> = [];
    
    // Calculate the difference in length when reverting the change
    const lengthDifference = rejectedChange.original_text.length - rejectedChange.enhanced_text.length;
    
    // Adjust positions of changes that come after the rejected change
    allChanges
      .filter(change => 
        change.id !== rejectedChange.id && 
        change.position_start > rejectedChange.position_start
      )
      .forEach(change => {
        adjustments.push({
          changeId: change.id,
          newStart: change.position_start + lengthDifference,
          newEnd: change.position_end + lengthDifference
        });
      });

    return adjustments;
  }

  /**
   * Validate that a change can still be applied at its recorded position
   */
  static validateChangePosition(
    change: AIChange,
    currentContent: string
  ): { isValid: boolean; actualText?: string; expectedText?: string } {
    if (change.position_start < 0 || change.position_end > currentContent.length) {
      return { 
        isValid: false,
        actualText: '',
        expectedText: change.enhanced_text
      };
    }

    const actualText = currentContent.substring(change.position_start, change.position_end);
    const expectedText = change.enhanced_text;

    // Allow for some flexibility in text matching due to formatting differences
    const normalizedActual = actualText.replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();

    return {
      isValid: normalizedActual === normalizedExpected,
      actualText,
      expectedText
    };
  }
}
