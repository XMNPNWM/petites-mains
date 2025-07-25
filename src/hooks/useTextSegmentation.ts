
import { useMemo } from 'react';

interface TextSegment {
  content: string;
  startIndex: number;
  endIndex: number;
  pageNumber: number;
}

// Legacy hook - maintained for backward compatibility
// New components should use useLineBasedSegmentation instead
export const useTextSegmentation = (content: string, wordsPerPage: number = 300) => {
  const segments = useMemo(() => {
    if (!content) return [];
    
    // Convert to line-based segmentation for consistency
    // Approximate: 300 words ≈ 25 lines (12 words per line average)
    const approximateLinesPerPage = Math.max(1, Math.round(wordsPerPage / 12));
    
    const cleanContent = content
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    const lines = cleanContent.split('\n');
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    let currentPageLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentPageLines.push(line);
      
      if (currentPageLines.length >= approximateLinesPerPage || i === lines.length - 1) {
        const pageContent = currentPageLines.join('\n');
        const startIndex = currentIndex;
        const endIndex = currentIndex + pageContent.length;
        
        segments.push({
          content: pageContent,
          startIndex,
          endIndex,
          pageNumber: segments.length + 1
        });
        
        currentIndex = endIndex + 1;
        currentPageLines = [];
      }
    }
    
    return segments;
  }, [content, wordsPerPage]);

  return segments;
};
