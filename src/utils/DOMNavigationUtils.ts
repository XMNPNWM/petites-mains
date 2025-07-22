
export class DOMNavigationUtils {
  /**
   * Find precise pixel position of character in DOM using text node traversal
   */
  static findCharacterPixelPosition(
    containerElement: HTMLElement,
    targetCharPosition: number
  ): number | null {
    if (!containerElement || targetCharPosition < 0) {
      return null;
    }

    console.log('🧭 DOMNavigationUtils: Finding pixel position for char:', targetCharPosition);

    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentCharIndex = 0;
    let textNode: Text | null = null;

    // Find the text node containing our target character
    while (textNode = walker.nextNode() as Text) {
      const nodeLength = textNode.textContent?.length || 0;
      
      if (currentCharIndex + nodeLength > targetCharPosition) {
        // Found the target text node
        const offsetInNode = targetCharPosition - currentCharIndex;
        
        try {
          const range = document.createRange();
          range.setStart(textNode, Math.min(offsetInNode, nodeLength));
          range.setEnd(textNode, Math.min(offsetInNode + 1, nodeLength));
          
          const rect = range.getBoundingClientRect();
          const containerRect = containerElement.getBoundingClientRect();
          
          // Calculate relative position within container
          const relativeTop = rect.top - containerRect.top + containerElement.scrollTop;
          
          console.log('🧭 DOMNavigationUtils: Found precise position:', {
            targetCharPosition,
            offsetInNode,
            rectTop: rect.top,
            containerTop: containerRect.top,
            scrollTop: containerElement.scrollTop,
            relativeTop
          });
          
          return relativeTop;
        } catch (error) {
          console.warn('Range creation failed:', error);
          return null;
        }
      }
      
      currentCharIndex += nodeLength;
    }

    console.warn('🧭 DOMNavigationUtils: Character position not found in DOM');
    return null;
  }

  /**
   * Smooth scroll to character position with proper centering
   */
  static scrollToCharacterPosition(
    containerElement: HTMLElement,
    targetCharPosition: number,
    behavior: 'smooth' | 'instant' = 'smooth'
  ): boolean {
    const pixelPosition = this.findCharacterPixelPosition(containerElement, targetCharPosition);
    
    if (pixelPosition === null) {
      return false;
    }

    // Center the position in the viewport
    const containerHeight = containerElement.clientHeight;
    const targetScrollTop = Math.max(0, pixelPosition - (containerHeight / 3));

    console.log('🧭 DOMNavigationUtils: Scrolling to position:', {
      pixelPosition,
      containerHeight,
      targetScrollTop,
      behavior
    });

    containerElement.scrollTo({
      top: targetScrollTop,
      behavior
    });

    return true;
  }

  /**
   * Validate if character position exists in text content
   */
  static validateCharacterPosition(text: string, position: number): boolean {
    return position >= 0 && position < text.length;
  }
}
