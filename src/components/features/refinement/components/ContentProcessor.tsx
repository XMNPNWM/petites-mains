
import { useMemo } from 'react';

interface ContentProcessorProps {
  content: string;
  linesPerPage: number;
  children: (processedContent: string) => React.ReactNode;
}

const ContentProcessor = ({ content, linesPerPage, children }: ContentProcessorProps) => {
  // Process content with STRICT paragraph preservation - double line breaks are sacred
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // Check if content is already HTML (enhanced content)
    const isHTML = /<[^>]+>/.test(content);
    
    if (isHTML) {
      // For HTML content (enhanced), validate paragraph structure is preserved
      // Ensure proper <p> tag structure exists
      let htmlContent = content;
      
      // If missing proper paragraph structure, add it
      if (!htmlContent.includes('<p>')) {
        htmlContent = content
          .replace(/\n\n/g, '</p><p>')  // Double line breaks become paragraph breaks
          .replace(/\n/g, '<br>')       // Single line breaks become <br>
          .replace(/^/, '<p>')          // Start with paragraph
          .replace(/$/, '</p>');        // End with paragraph
      }
      
      return htmlContent;
    } else {
      // For plain text (original), convert ONLY double line breaks to paragraphs
      // Single line breaks within paragraphs become spaces to preserve readability
      const paragraphs = content.split('\n\n');
      const processedParagraphs = paragraphs
        .map(p => p.replace(/\n/g, ' ').trim())  // Convert single \n to spaces within paragraphs
        .filter(p => p.length > 0);              // Remove empty paragraphs
      
      return '<p>' + processedParagraphs.join('</p><p>') + '</p>';
    }
  }, [content]);

  return <>{children(processedContent)}</>;
};

export default ContentProcessor;
