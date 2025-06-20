
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export const useVisualTextEditor = (initialContent: string = '') => {
  const [content, setContent] = useState(initialContent);
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update content when initial content changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Debounced content change handler to prevent excessive re-renders
  const handleContentChange = useCallback((newContent: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setContent(newContent);
    }, 16); // ~60fps update rate
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setScrollPosition({
      top: target.scrollTop,
      left: target.scrollLeft
    });
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // Update immediately for typing responsiveness
    setContent(newContent);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    content,
    scrollPosition,
    textareaRef,
    handleContentChange,
    handleScroll,
    handleInput
  };
};
