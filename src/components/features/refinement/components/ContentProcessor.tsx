
import { useMemo } from 'react';
import { useLineBasedSegmentation } from '@/hooks/useLineBasedSegmentation';

interface ContentProcessorProps {
  content: string;
  linesPerPage: number;
  children: (processedContent: string) => React.ReactNode;
}

const ContentProcessor = ({ content, linesPerPage, children }: ContentProcessorProps) => {
  // Convert content to include page breaks
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    const segments = useLineBasedSegmentation(content, linesPerPage);
    if (segments.length <= 1) return content;
    
    // Insert page breaks between segments
    return segments
      .map((segment, index) => {
        if (index === segments.length - 1) {
          return segment.content;
        }
        return segment.content + '<div data-type="page-break"></div>';
      })
      .join('');
  }, [content, linesPerPage]);

  return <>{children(processedContent)}</>;
};

export default ContentProcessor;
