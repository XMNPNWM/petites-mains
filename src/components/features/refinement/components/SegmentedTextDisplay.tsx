
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastNavigatedRange, setLastNavigatedRange] = useState<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Escape HTML to prevent XSS attacks
  const escapeHtml = (unsafe: string): string => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // DOM-based character position to scroll position conversion
  const getScrollPositionFromCharacter = (charPosition: number): number => {
    const container = contentRef.current;
    if (!container) return 0;

    // Create a range to find the DOM position of the character
    const range = document.createRange();
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPos = 0;
    let node;

    while (node = walker.nextNode()) {
      const textNode = node as Text;
      const nodeLength = textNode.textContent?.length || 0;
      
      if (currentPos + nodeLength >= charPosition) {
        // Found the target text node
        const offsetInNode = charPosition - currentPos;
        try {
          range.setStart(textNode, Math.min(offsetInNode, nodeLength));
          range.setEnd(textNode, Math.min(offsetInNode, nodeLength));
          
          const rect = range.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          return rect.top - containerRect.top + (containerRef.current?.scrollTop || 0);
        } catch (e) {
          console.warn('Range creation failed:', e);
          return 0;
        }
      }
      
      currentPos += nodeLength;
    }

    return 0;
  };

  // Fixed scroll to character position with proper loop prevention
  const scrollToCharacterPosition = (charPosition: number, rangeId: string) => {
    const container = containerRef.current;
    if (!container || isScrolling) return;

    console.log('🧭 SegmentedTextDisplay: Navigating to character position:', charPosition, 'rangeId:', rangeId);

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    const targetScrollPosition = getScrollPositionFromCharacter(charPosition);
    
    // Set navigation state to prevent re-entry
    setIsScrolling(true);
    setLastNavigatedRange(rangeId);
    
    container.scrollTo({
      top: targetScrollPosition - 100, // Offset for better visibility
      behavior: 'smooth'
    });

    // Reset scrolling flag after animation completes
    navigationTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      console.log('🧭 SegmentedTextDisplay: Navigation completed for range:', rangeId);
    }, 600);
  };

  // Handle scroll synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScrollSync) return;

    const handleScroll = () => {
      if (isScrolling) return; // Prevent feedback loop during programmatic scrolling
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollSync, isScrolling]);

  // Listen for external scroll sync events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleExternalSync = (event: CustomEvent) => {
      const { sourcePanel, scrollRatio } = event.detail;
      
      if (sourcePanel === 'original' || isScrolling) return;

      const { scrollHeight, clientHeight } = container;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      container.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, [isScrolling]);

  // Apply external scroll position (for navigation)
  useEffect(() => {
    if (scrollPosition !== undefined && containerRef.current && !isScrolling) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition, isScrolling]);

  // FIXED: Handle highlighted range navigation with proper comparison and no automatic reset
  useEffect(() => {
    if (!highlightedRange || isScrolling) return;
    
    const rangeId = `${highlightedRange.start}-${highlightedRange.end}`;
    
    // Only navigate if this is actually a different range
    if (lastNavigatedRange !== rangeId) {
      console.log('🧭 SegmentedTextDisplay: New highlighted range detected:', rangeId);
      scrollToCharacterPosition(highlightedRange.start, rangeId);
    }
  }, [highlightedRange?.start, highlightedRange?.end]); // Only depend on the actual range values

  // Generate highlighted content with XSS protection
  const getHighlightedContent = () => {
    if (!highlightedRange || !content) return escapeHtml(content);
    
    const { start, end } = highlightedRange;
    const before = escapeHtml(content.slice(0, start));
    const highlighted = escapeHtml(content.slice(start, end));
    const after = escapeHtml(content.slice(end));
    
    return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800/40 px-1 rounded transition-all duration-300 animate-pulse">${highlighted}</mark>${after}`;
  };

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto prose-sm max-w-none p-4 text-sm leading-relaxed"
    >
      <div 
        ref={contentRef}
        className="whitespace-pre-wrap leading-relaxed break-words text-sm"
        style={{ lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
      />
    </div>
  );
};

export default SegmentedTextDisplay;
