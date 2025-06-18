
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { hasValidNavigationData, getNavigationStatusMessage } from '../utils/navigationUtils';

interface CommentBoxHeaderProps {
  popup: {
    chapterId?: string;
    lineNumber: number | null;
  };
  showDeleteConfirm: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onClose: () => void;
}

const CommentBoxHeader = ({ 
  popup, 
  showDeleteConfirm, 
  onMouseDown, 
  onDelete, 
  onClose 
}: CommentBoxHeaderProps) => {
  const hasValidNavigation = hasValidNavigationData(popup.chapterId, popup.lineNumber);
  const statusMessage = getNavigationStatusMessage(popup.chapterId, popup.lineNumber);

  return (
    <div 
      className="bg-blue-50 border-b border-blue-200 p-3 cursor-move flex items-center gap-3 rounded-t-lg hover:bg-blue-100 transition-colors"
      onMouseDown={onMouseDown}
    >
      <GripVertical className="w-6 h-6 text-blue-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-blue-800">Comment</h3>
        <div className="text-xs">
          {hasValidNavigation ? (
            <span className="text-green-600">Line {popup.lineNumber} • Navigation ready</span>
          ) : (
            <span className="text-orange-600">{statusMessage}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button 
          onClick={onDelete} 
          variant={showDeleteConfirm ? "destructive" : "ghost"} 
          size="sm"
          className="h-6 w-6 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
        <Button onClick={onClose} variant="ghost" size="sm" className="h-6 w-6 p-0">
          ×
        </Button>
      </div>
    </div>
  );
};

export default CommentBoxHeader;
