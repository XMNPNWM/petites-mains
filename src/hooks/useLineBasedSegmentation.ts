
import { useMemo } from 'react';

interface LineSegment {
  content: string;
  startIndex: number;
  endIndex: number;
  pageNumber: number;
  lineCount: number;
}

export const useLineBasedSegmentation = (content: string, linesPerPage: number = 25) => {
  const segments = useMemo(() => {
    // Add proper null/undefined checks
    if (!content || typeof content !== 'string') return [];
    
    // Clean content and preserve structure while maintaining proper spacing
    const cleanContent = content
      .replace(/<p>/g, '\n\n')  // Add double line breaks for paragraphs
      .replace(/<\/p>/g, '')    // Remove closing p tags
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')  // Remove other HTML tags
      .replace(/\n{3,}/g, '\n\n')  // Normalize excessive line breaks to double
      .replace(/^\n+|\n+$/g, '')   // Remove leading/trailing newlines
      .trim();
    
    // Handle empty content after cleaning
    if (!cleanContent) return [];
    
    const lines = cleanContent.split('\n');
    const segments: LineSegment[] = [];
    let currentIndex = 0;
    let currentPageLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentPageLines.push(line);
      
      if (currentPageLines.length >= linesPerPage || i === lines.length - 1) {
        const pageContent = currentPageLines.join('\n');
        const startIndex = currentIndex;
        const endIndex = currentIndex + pageContent.length;
        
        segments.push({
          content: pageContent,
          startIndex,
          endIndex,
          pageNumber: segments.length + 1,
          lineCount: currentPageLines.length
        });
        
        currentIndex = endIndex + 1; // +1 for the line break between pages
        currentPageLines = [];
      }
    }
    
    return segments;
  }, [content, linesPerPage]);

  return segments;
};
