import React, { useRef, useEffect } from 'react';
import { AIChange } from '@/types/shared';

interface DualPanelNavigationProps {
  selectedChange: AIChange | null;
  originalContent: string;
  enhancedContent: string;
  originalPanelRef: React.RefObject<HTMLElement>;
  enhancedPanelRef: React.RefObject<HTMLElement>;
  onClearSelection?: () => void;
}

/**
 * Component for handling dual panel navigation and highlighting
 * Manages synchronized highlighting across original and enhanced text panels
 */
export const DualPanelNavigation: React.FC<DualPanelNavigationProps> = ({
  selectedChange,
  originalContent,
  enhancedContent,
  originalPanelRef,
  enhancedPanelRef,
  onClearSelection
}) => {
  const highlightTimeoutRef = useRef<NodeJS.Timeout>();

  // Clear previous highlighting when selection changes
  useEffect(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    if (selectedChange) {
      highlightChangeInPanels(selectedChange);
    } else {
      clearHighlighting();
    }

    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [selectedChange]);

  /**
   * Highlight the change in both panels with smooth scrolling
   */
  const highlightChangeInPanels = (change: AIChange) => {
    // Highlight in original panel if position data is available
    if (change.original_position_start !== undefined && originalPanelRef.current) {
      highlightTextInPanel(
        originalPanelRef.current,
        originalContent,
        change.original_position_start,
        change.original_position_end || change.position_end,
        'bg-red-100 border-l-4 border-red-400'
      );
    }

    // Highlight in enhanced panel
    if (change.enhanced_position_start !== undefined && enhancedPanelRef.current) {
      highlightTextInPanel(
        enhancedPanelRef.current,
        enhancedContent,
        change.enhanced_position_start,
        change.enhanced_position_end || change.position_end,
        'bg-green-100 border-l-4 border-green-400'
      );
    } else if (enhancedPanelRef.current) {
      // Fallback to legacy positions for enhanced panel
      highlightTextInPanel(
        enhancedPanelRef.current,
        enhancedContent,
        change.position_start,
        change.position_end,
        'bg-green-100 border-l-4 border-green-400'
      );
    }

    // Auto-clear highlighting after 10 seconds
    highlightTimeoutRef.current = setTimeout(() => {
      clearHighlighting();
      onClearSelection?.();
    }, 10000);
  };

  /**
   * Highlight specific text range in a panel
   */
  const highlightTextInPanel = (
    panel: HTMLElement, 
    content: string, 
    startPos: number, 
    endPos: number,
    highlightClass: string
  ) => {
    try {
      // Find text nodes in the panel
      const walker = document.createTreeWalker(
        panel,
        NodeFilter.SHOW_TEXT
      );

      let currentPos = 0;
      let textNode: Text | null = null;
      let startNode: Text | null = null;
      let endNode: Text | null = null;
      let startOffset = 0;
      let endOffset = 0;

      // Find the start and end text nodes
      while ((textNode = walker.nextNode() as Text)) {
        const nodeLength = textNode.textContent?.length || 0;
        
        if (currentPos <= startPos && currentPos + nodeLength > startPos) {
          startNode = textNode;
          startOffset = startPos - currentPos;
        }
        
        if (currentPos <= endPos && currentPos + nodeLength >= endPos) {
          endNode = textNode;
          endOffset = endPos - currentPos;
          break;
        }
        
        currentPos += nodeLength;
      }

      // Create range and highlight
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        // Remove existing highlights
        clearHighlightingInPanel(panel);

        // Create highlighting element
        const highlightSpan = document.createElement('span');
        highlightSpan.className = `change-highlight ${highlightClass} transition-all duration-300 rounded px-1`;
        highlightSpan.setAttribute('data-change-highlight', 'true');

        try {
          range.surroundContents(highlightSpan);
          
          // Scroll to highlight
          highlightSpan.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        } catch (error) {
          console.warn('Could not highlight range:', error);
          // Fallback: just scroll to approximate position
          const approximateElement = findElementAtPosition(panel, startPos);
          if (approximateElement) {
            approximateElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error highlighting text in panel:', error);
    }
  };

  /**
   * Find element at approximate text position
   */
  const findElementAtPosition = (panel: HTMLElement, position: number): Element | null => {
    const elements = panel.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    let currentPos = 0;
    
    for (const element of elements) {
      const text = element.textContent || '';
      if (currentPos + text.length >= position) {
        return element;
      }
      currentPos += text.length;
    }
    
    return null;
  };

  /**
   * Clear all highlighting in a specific panel
   */
  const clearHighlightingInPanel = (panel: HTMLElement) => {
    const highlights = panel.querySelectorAll('[data-change-highlight="true"]');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        // Move text content back to parent
        while (highlight.firstChild) {
          parent.insertBefore(highlight.firstChild, highlight);
        }
        parent.removeChild(highlight);
        
        // Normalize text nodes
        parent.normalize();
      }
    });
  };

  /**
   * Clear highlighting in both panels
   */
  const clearHighlighting = () => {
    if (originalPanelRef.current) {
      clearHighlightingInPanel(originalPanelRef.current);
    }
    if (enhancedPanelRef.current) {
      clearHighlightingInPanel(enhancedPanelRef.current);
    }
  };

  // This component doesn't render anything visible
  return null;
};

/**
 * Hook for managing dual panel navigation
 */
export const useDualPanelNavigation = () => {
  const originalPanelRef = useRef<HTMLDivElement>(null);
  const enhancedPanelRef = useRef<HTMLDivElement>(null);

  const handleChangeHighlight = (change: AIChange, panelType: 'original' | 'enhanced') => {
    console.log(`🎯 Highlighting change in ${panelType} panel:`, {
      changeId: change.id,
      type: change.change_type,
      originalPos: change.original_position_start,
      enhancedPos: change.enhanced_position_start,
      isLegacy: false
    });

    // The actual highlighting is handled by DualPanelNavigation component
    // This hook just provides the refs and callback
  };

  return {
    originalPanelRef,
    enhancedPanelRef,
    handleChangeHighlight
  };
};

export default DualPanelNavigation;