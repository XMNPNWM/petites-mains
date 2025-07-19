
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GripVertical, FileText } from 'lucide-react';
import { Chapter } from '@/types/shared';
import { ExportChapterSelection } from '@/stores/useExportStore';

interface ExportChapterCardProps {
  chapter: Chapter;
  selection: ExportChapterSelection | null;
  isSelected: boolean;
  order: number;
  onToggleSelection: () => void;
  onContentSourceChange: (source: 'original' | 'enhanced') => void;
  hasEnhancedContent: boolean;
}

const ExportChapterCard = ({
  chapter,
  selection,
  isSelected,
  order,
  onToggleSelection,
  onContentSourceChange,
  hasEnhancedContent
}: ExportChapterCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chapter.id,
    disabled: !isSelected
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (!content) return 'No content available...';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <Card className={`mb-3 transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Selection Checkbox */}
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelection}
                id={`chapter-${chapter.id}`}
              />
              {isSelected && (
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-blue-600">#{order + 1}</span>
                  <div {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Chapter Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <Label 
                    htmlFor={`chapter-${chapter.id}`}
                    className="text-base font-semibold text-gray-900 cursor-pointer"
                  >
                    {chapter.title}
                  </Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {chapter.word_count || 0} words
                    </span>
                    <Badge className={`px-2 py-1 text-xs ${getStatusColor(chapter.status)}`}>
                      {chapter.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {truncateContent(chapter.content)}
              </p>

              {/* Content Source Selection */}
              {isSelected && (
                <div className="border-t pt-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Content Source:
                  </Label>
                  <RadioGroup
                    value={selection?.contentSource || 'original'}
                    onValueChange={(value: 'original' | 'enhanced') => onContentSourceChange(value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="original" id={`original-${chapter.id}`} />
                      <Label htmlFor={`original-${chapter.id}`} className="text-sm">
                        Original Content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="enhanced" 
                        id={`enhanced-${chapter.id}`}
                        disabled={!hasEnhancedContent}
                      />
                      <Label 
                        htmlFor={`enhanced-${chapter.id}`} 
                        className={`text-sm ${!hasEnhancedContent ? 'text-gray-400' : ''}`}
                      >
                        Enhanced Content {!hasEnhancedContent && '(Not Available)'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportChapterCard;
