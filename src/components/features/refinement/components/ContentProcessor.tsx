
import { useMemo } from 'react';
import { useLineBasedSegmentation } from '@/hooks/useLineBasedSegmentation';

interface ContentProcessorProps {
  content: string;
  linesPerPage: number;
  children: (processedContent: string) => React.ReactNode;
}

const ContentProcessor = ({ content, linesPerPage, children }: ContentProcessorProps) => {
  // Call hook at top level (React Rules of Hooks)
  const segments = useLineBasedSegmentation(content || '', linesPerPage);
  
  // Process segments into final content
  const processedContent = useMemo(() => {
    if (!content) return '';
    if (segments.length <= 1) return content;
    
    // Insert page breaks between segments while preserving formatting
    return segments
      .map((segment, index) => {
        // Preserve content formatting and spacing
        const formattedContent = segment.content
          .replace(/\n/g, '<br>')  // Convert newlines to HTML breaks
          .replace(/\n\n/g, '<br><br>');  // Double breaks for paragraphs
        
        if (index === segments.length - 1) {
          return formattedContent;
        }
        return formattedContent + '<div data-type="page-break"></div>';
      })
      .join('');
  }, [content, segments]);

  return <>{children(processedContent)}</>;
};

export default ContentProcessor;
