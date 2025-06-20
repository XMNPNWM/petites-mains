
import React, { useEffect, useRef, useMemo } from 'react';
import { renderFormattedContent } from '@/lib/contentRenderUtils';

interface VisualDisplayLayerProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  scrollTop: number;
  scrollLeft: number;
}

const VisualDisplayLayer = ({ content, textareaRef, scrollTop, scrollLeft }: VisualDisplayLayerProps) => {
  const displayRef = useRef<HTMLDivElement>(null);

  // Memoize formatted content to prevent unnecessary re-renders
  const formattedContent = useMemo(() => {
    return renderFormattedContent(content);
  }, [content]);

  // Synchronize scroll position with textarea
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = scrollTop;
      displayRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  return (
    <div
      ref={displayRef}
      className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
      style={{
        padding: '12px',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        lineHeight: 'inherit',
        letterSpacing: 'inherit',
        wordSpacing: 'inherit',
        color: 'inherit',
        backgroundColor: 'transparent',
        userSelect: 'none',
        zIndex: 1,
        border: '1px solid transparent' // Match textarea border
      }}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

export default VisualDisplayLayer;
