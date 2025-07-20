
import { useMemo } from 'react';

interface ContentProcessorProps {
  content: string;
  linesPerPage: number;
  children: (processedContent: string) => React.ReactNode;
}

const ContentProcessor = ({ content, linesPerPage, children }: ContentProcessorProps) => {
  // Process content based on type - preserve structure without artificial segmentation
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // Check if content is already HTML (enhanced content)
    const isHTML = /<[^>]+>/.test(content);
    
    if (isHTML) {
      // For HTML content (enhanced), preserve existing structure
      return content;
    } else {
      // For plain text (original), convert line breaks to HTML properly
      return content
        .replace(/\n\n/g, '</p><p>')  // Double line breaks become paragraph breaks
        .replace(/\n/g, '<br>')       // Single line breaks become <br>
        .replace(/^/, '<p>')          // Start with paragraph
        .replace(/$/, '</p>');        // End with paragraph
    }
  }, [content]);

  return <>{children(processedContent)}</>;
};

export default ContentProcessor;
