
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
    
    // Preserve line breaks and paragraph structure
    const cleanContent = content
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '') // Remove other HTML tags
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks
      .trim();
    
    const words = cleanContent.split(/(\s+)/); // Split but keep whitespace
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    let wordCount = 0;
    let currentSegmentWords: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentSegmentWords.push(word);
      
      // Count actual words (not whitespace)
      if (word.trim()) {
        wordCount++;
      }
      
      if (wordCount >= wordsPerPage || i === words.length - 1) {
        const pageContent = currentSegmentWords.join('');
        const startIndex = currentIndex;
        const endIndex = currentIndex + pageContent.length;
        
        segments.push({
          content: pageContent,
          startIndex,
          endIndex,
          pageNumber: segments.length + 1
        });
        
        currentIndex = endIndex;
        wordCount = 0;
        currentSegmentWords = [];
      }
    }
    
    return segments;
  }, [content, wordsPerPage]);

  return segments;
};
