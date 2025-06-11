
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Minimize2, MapPin } from 'lucide-react';

interface SimpleCommentBoxProps {
  id: string;
  position: { x: number; y: number };
  selectedText?: string;
  lineNumber?: number;
  chapterId?: string;
  onClose: () => void;
  onMinimize: () => void;
  onSave: (comment: string) => void;
  onGoToLine?: (chapterId: string, lineNumber: number) => void;
  isMinimized: boolean;
  initialComment?: string;
}

const SimpleCommentBox = ({
  id,
  position,
  selectedText,
  lineNumber,
  chapterId,
  onClose,
  onMinimize,
  onSave,
  onGoToLine,
  isMinimized,
  initialComment = ''
}: SimpleCommentBoxProps) => {
  const [comment, setComment] = useState(initialComment);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('textarea')) {
      return;
    }
    
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCurrentPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSave = () => {
    if (comment.trim()) {
      onSave(comment.trim());
    }
  };

  const handleGoToLine = () => {
    if (chapterId && lineNumber && onGoToLine) {
      onGoToLine(chapterId, lineNumber);
    }
  };

  if (isMinimized) {
    return (
      <Card 
        ref={cardRef}
        className="fixed w-48 bg-blue-50 border-blue-200 shadow-md cursor-move z-50"
        style={{ 
          left: currentPosition.x, 
          top: currentPosition.y,
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 font-medium truncate">Comment</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={onMinimize} className="h-6 w-6 p-0">
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      ref={cardRef}
      className="fixed w-80 bg-white border-blue-200 shadow-lg cursor-move z-50"
      style={{ 
        left: currentPosition.x, 
        top: currentPosition.y,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-slate-700">Comment</span>
          </div>
          <div className="flex gap-1">
            {lineNumber && chapterId && onGoToLine && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleGoToLine}
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                title="Go to line"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Line {lineNumber}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onMinimize} className="h-7 w-7 p-0">
              <Minimize2 className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {selectedText && (
          <div className="mb-3 p-2 bg-slate-50 rounded text-xs text-slate-600 border-l-2 border-blue-200">
            <strong>Selected text:</strong> "{selectedText}"
          </div>
        )}

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your comment..."
          className="mb-3 min-h-[80px] resize-none"
          onMouseDown={(e) => e.stopPropagation()}
        />

        <div className="flex justify-end gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!comment.trim()}
            className="text-xs bg-blue-600 hover:bg-blue-700"
          >
            Save Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleCommentBox;
