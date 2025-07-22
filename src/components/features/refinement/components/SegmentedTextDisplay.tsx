
import React, { useRef, useEffect, useState } from 'react';

interface SegmentedTextDisplayProps {
  content: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  highlightedRange?: { start: number; end: number } | null;
  linesPerPage?: number; // Keep for compatibility but ignore
}

const SegmentedTextDisplay = ({
  content,
  onScrollSync,
  scrollPosition,
  highlightedRange,
  linesPerPage = 25 // Ignored parameter for backward compatibility
}: SegmentedTextDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  // Escape HTML to prevent XSS attacks
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Convert character position to DOM node and offset
  const findTextNodeAtPosition = (container: HTMLElement, targetPosition: number): { node: Text | null, offset: number } => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPosition = 0;
    let node: Text | null = null;

    while (node = walker.nextNode() as Text) {
      const nodeLength = node.textContent?.length || 0;
      
      if (currentPosition + nodeLength >= targetPosition) {
        return {
          node,
          offset: targetPosition - currentPosition
        };
      }
      
      currentPosition += nodeLength;
    }

    return { node: null, offset: 0 };
  };

  // Scroll to character position with smooth animation
  const scrollToCharacterPosition = (position: number) => {
    const container = containerRef.current;
    if (!container) return;

    const { node, offset } = findTextNodeAtPosition(container, position);
    
    if (!node) {
      console.warn('Could not find text node at position:', position);
      return;
    }

    // Create a range to get the position
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset);

    // Create a temporary element to get the position
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the scroll position relative to the container
    const targetScrollTop = container.scrollTop + rect.top - containerRect.top - 100; // 100px offset from top
    
    // Smooth scroll to position
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });

    console.log('🧭 Scrolled to character position:', position, { 
      scrollTop: targetScrollTop,
      nodeOffset: offset 
    });
  };

  // Create highlighted content with proper DOM structure
  const createHighlightedContent = () => {
    if (!highlightedRange || !content) {
      return { __html: escapeHtml(content) };
    }
    
    const { start, end } = highlightedRange;
    const before = escapeHtml(content.slice(0, start));
    const highlighted = escapeHtml(content.slice(start, end));
    const after = escapeHtml(content.slice(end));
    
    const highlightedHtml = `${before}<mark id="highlighted-text" class="bg-yellow-200 dark:bg-yellow-800/40 px-1 rounded transition-all duration-300 shadow-sm ring-2 ring-yellow-300">${highlighted}</mark>${after}`;
    
    return { __html: highlightedHtml };
  };

  // Handle scroll synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollSync) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

  // Listen for external scroll sync events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleExternalSync = (event: CustomEvent) => {
      const { sourcePanel, scrollRatio } = event.detail;
      
      if (sourcePanel === 'original') return;

      const { scrollHeight, clientHeight } = container;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      container.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, []);

  // Apply external scroll position
  useEffect(() => {
    if (scrollPosition !== undefined && containerRef.current) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Handle highlighting and navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !highlightedRange) {
      setHighlightedElement(null);
      return;
    }

    // Wait for DOM to update with highlighted content
    const timeoutId = setTimeout(() => {
      const highlightElement = container.querySelector('#highlighted-text') as HTMLElement;
      
      if (highlightElement) {
        setHighlightedElement(highlightElement);
        
        // Scroll to the highlighted element
        scrollToCharacterPosition(highlightedRange.start);
        
        console.log('🎯 Highlighted text in original panel:', {
          range: highlightedRange,
          elementFound: !!highlightElement
        });
      } else {
        console.warn('Could not find highlighted element in original panel');
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [highlightedRange]);

  // Cleanup highlighted element when range is cleared
  useEffect(() => {
    if (!highlightedRange && highlightedElement) {
      setHighlightedElement(null);
    }
  }, [highlightedRange, highlightedElement]);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto prose-sm max-w-none p-4 text-sm leading-relaxed"
    >
      <div 
        className="whitespace-pre-wrap leading-relaxed break-words text-sm"
        style={{ lineHeight: '1.6' }}
        dangerouslySetInnerHTML={createHighlightedContent()}
      />
    </div>
  );
};

export default SegmentedTextDisplay;
