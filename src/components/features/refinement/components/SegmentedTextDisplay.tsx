
import React from 'react';
import { useTextSegmentation } from '@/hooks/useTextSegmentation';

interface SegmentedTextDisplayProps {
  content: string;
  highlightedRange?: { start: number; end: number } | null;
  wordsPerPage?: number;
}

const SegmentedTextDisplay = ({ 
  content, 
  highlightedRange, 
  wordsPerPage = 300 
}: SegmentedTextDisplayProps) => {
  const segments = useTextSegmentation(content, wordsPerPage);

  const renderSegmentWithHighlight = (segment: any) => {
    if (!highlightedRange) {
      return <div className="whitespace-pre-wrap leading-relaxed break-words text-sm">{segment.content}</div>;
    }

    const segmentStart = segment.startIndex;
    const segmentEnd = segment.endIndex;
    const highlightStart = highlightedRange.start;
    const highlightEnd = highlightedRange.end;

    // Check if highlight overlaps with this segment
    if (highlightEnd < segmentStart || highlightStart > segmentEnd) {
      return <div className="whitespace-pre-wrap leading-relaxed break-words text-sm">{segment.content}</div>;
    }

    // Calculate relative positions within the segment
    const relativeHighlightStart = Math.max(0, highlightStart - segmentStart);
    const relativeHighlightEnd = Math.min(segment.content.length, highlightEnd - segmentStart);

    const before = segment.content.slice(0, relativeHighlightStart);
    const highlighted = segment.content.slice(relativeHighlightStart, relativeHighlightEnd);
    const after = segment.content.slice(relativeHighlightEnd);

    return (
      <div className="whitespace-pre-wrap leading-relaxed break-words text-sm">
        {before}
        <span className="bg-yellow-200 px-1 rounded animate-pulse">
          {highlighted}
        </span>
        {after}
      </div>
    );
  };

  if (segments.length === 0) {
    // Clean content from HTML tags and preserve line breaks
    const cleanContent = content
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    return <div className="whitespace-pre-wrap leading-relaxed break-words text-sm">{cleanContent}</div>;
  }

  return (
    <div className="space-y-8">
      {segments.map((segment, index) => (
        <div key={index} className="min-h-[400px] border-b border-slate-100 pb-6 last:border-b-0">
          <div className="text-xs text-slate-400 mb-2 text-right">Page {segment.pageNumber}</div>
          {renderSegmentWithHighlight(segment)}
        </div>
      ))}
    </div>
  );
};

export default SegmentedTextDisplay;
