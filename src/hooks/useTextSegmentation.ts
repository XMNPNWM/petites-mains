
import { useMemo } from 'react';

interface TextSegment {
  content: string;
  startIndex: number;
  endIndex: number;
  pageNumber: number;
}

export const useTextSegmentation = (content: string, wordsPerPage: number = 300) => {
  const segments = useMemo(() => {
    if (!content) return [];
    
    const words = content.split(/\s+/);
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      const pageContent = pageWords.join(' ');
      const startIndex = currentIndex;
      const endIndex = currentIndex + pageContent.length;
      
      segments.push({
        content: pageContent,
        startIndex,
        endIndex,
        pageNumber: Math.floor(i / wordsPerPage) + 1
      });
      
      currentIndex = endIndex + 1; // +1 for the space between segments
    }
    
    return segments;
  }, [content, wordsPerPage]);

  return segments;
};
