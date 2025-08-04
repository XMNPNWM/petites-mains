import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface ChapterBadgeProps {
  chapterId?: string | null;
  chapters?: Array<{
    id: string;
    title: string;
    order_index: number;
  }>;
  className?: string;
}

export const ChapterBadge: React.FC<ChapterBadgeProps> = ({ 
  chapterId, 
  chapters = [], 
  className 
}) => {
  if (!chapterId || chapters.length === 0) {
    return null;
  }

  const chapter = chapters.find(c => c.id === chapterId);
  
  if (!chapter) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-xs flex items-center gap-1 ${className}`}
    >
      <FileText className="w-3 h-3" />
      Ch. {chapter.order_index}
    </Badge>
  );
};