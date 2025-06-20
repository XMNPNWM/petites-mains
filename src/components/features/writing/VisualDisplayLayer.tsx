
import React, { useEffect, useRef } from 'react';
import { renderFormattedContent } from '@/lib/contentRenderUtils';

interface VisualDisplayLayerProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  scrollTop: number;
  scrollLeft: number;
}

const VisualDisplayLayer = ({ content, textareaRef, scrollTop, scrollLeft }: VisualDisplayLayerProps) => {
  const displayRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll position with textarea
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = scrollTop;
      displayRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  // Synchronize dimensions and positioning with textarea
  useEffect(() => {
    if (!displayRef.current || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const display = displayRef.current;
    
    const syncDimensions = () => {
      const textareaStyles = window.getComputedStyle(textarea);
      
      // Copy all relevant styles from textarea
      display.style.position = 'absolute';
      display.style.top = '0';
      display.style.left = '0';
      display.style.width = textarea.offsetWidth + 'px';
      display.style.height = textarea.offsetHeight + 'px';
      display.style.padding = textareaStyles.padding;
      display.style.border = textareaStyles.border;
      display.style.borderColor = 'transparent'; // Hide border on display layer
      display.style.fontSize = textareaStyles.fontSize;
      display.style.fontFamily = textareaStyles.fontFamily;
      display.style.lineHeight = textareaStyles.lineHeight;
      display.style.letterSpacing = textareaStyles.letterSpacing;
      display.style.wordSpacing = textareaStyles.wordSpacing;
      display.style.whiteSpace = 'pre-wrap';
      display.style.wordBreak = 'break-word';
      display.style.overflow = 'hidden';
      display.style.pointerEvents = 'none'; // Allow clicks to pass through
      display.style.zIndex = '1'; // Above textarea but below other UI elements
    };

    syncDimensions();

    // Observe resize changes
    const resizeObserver = new ResizeObserver(syncDimensions);
    resizeObserver.observe(textarea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [textareaRef]);

  const formattedContent = renderFormattedContent(content);

  return (
    <div
      ref={displayRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        color: 'inherit',
        backgroundColor: 'transparent',
        userSelect: 'none',
        zIndex: 1
      }}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

export default VisualDisplayLayer;
