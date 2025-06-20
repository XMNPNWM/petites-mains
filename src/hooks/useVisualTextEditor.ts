
import { useState, useCallback, useRef, useEffect } from 'react';

export const useVisualTextEditor = (initialContent: string = '') => {
  const [content, setContent] = useState(initialContent);
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when initial content changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
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
    handleContentChange(newContent);
  }, [handleContentChange]);

  return {
    content,
    scrollPosition,
    textareaRef,
    handleContentChange,
    handleScroll,
    handleInput
  };
};
