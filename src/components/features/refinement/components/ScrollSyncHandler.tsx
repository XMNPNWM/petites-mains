
import React, { useRef, useEffect } from 'react';

interface ScrollSyncHandlerProps {
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  children: React.ReactNode;
}

const ScrollSyncHandler = ({ 
  onScrollSync, 
  scrollPosition, 
  children 
}: ScrollSyncHandlerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll synchronization
  useEffect(() => {
    const editorElement = containerRef.current?.querySelector('.ProseMirror');
    if (!editorElement || !onScrollSync) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = editorElement;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    editorElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => editorElement.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

  // Listen for external scroll sync events
  useEffect(() => {
    const editorElement = containerRef.current?.querySelector('.ProseMirror');
    if (!editorElement) return;

    const handleExternalSync = (event: CustomEvent) => {
      const { sourcePanel, scrollRatio } = event.detail;
      
      if (sourcePanel === 'enhanced') return;

      const { scrollHeight, clientHeight } = editorElement;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const targetScrollTop = scrollRatio * maxScroll;
      
      editorElement.scrollTop = targetScrollTop;
    };

    window.addEventListener('scrollSync', handleExternalSync as EventListener);
    return () => window.removeEventListener('scrollSync', handleExternalSync as EventListener);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden">
      {children}
    </div>
  );
};

export default ScrollSyncHandler;
