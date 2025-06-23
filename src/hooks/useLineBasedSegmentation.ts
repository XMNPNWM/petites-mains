
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
    
    // Clean content and preserve structure
    const cleanContent = content
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '') // Remove other HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks
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
