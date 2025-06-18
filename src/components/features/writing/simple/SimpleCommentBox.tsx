import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Trash2, MapPin, GripVertical } from 'lucide-react';
import { useSimplePopups } from './SimplePopupManager';
import { toast } from '@/hooks/use-toast';

interface Popup {
  id: string;
  type: string;
  projectId: string;
  chapterId?: string;
  textPosition: number | null;
  selectedText: string | null;
  lineNumber: number | null;
  position: { x: number; y: number };
  messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[];
  status: string | null;
  isMinimized: boolean;
}

interface SimpleCommentBoxProps {
  popup: Popup;
  onUpdate: (id: string, messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[]) => void;
  onClose: (id: string) => void;
}

const SimpleCommentBox = ({ popup, onUpdate, onClose }: SimpleCommentBoxProps) => {
  const [comment, setComment] = useState('');
  const [messages, setMessages] = useState(popup.messages || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const { updatePopup, closePopup, deletePopup, goToLine } = useSimplePopups();
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(popup.messages || []);
  }, [popup.messages]);

  // Debug navigation data on popup changes
  useEffect(() => {
    console.log('SimpleCommentBox navigation debug:', {
      popupId: popup.id,
      chapterId: popup.chapterId,
      lineNumber: popup.lineNumber,
      selectedText: popup.selectedText,
      shouldShowGoToLineButton: !!(popup.chapterId && popup.lineNumber !== null && popup.lineNumber !== undefined)
    });
  }, [popup.chapterId, popup.lineNumber, popup.selectedText]);

  // Enhanced dragging functionality with larger drag area
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the left portion of the header (grip + title area)
    const target = e.target as HTMLElement;
    const isActionButton = target.closest('button');
    if (isActionButton) return; // Don't drag when clicking action buttons
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - popup.position.x,
      y: e.clientY - popup.position.y
    });
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition = {
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 400, e.clientY - dragOffset.y))
      };
      
      updatePopup(popup.id, { position: newPosition });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, popup.id, updatePopup]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleAddComment = () => {
    if (comment.trim() !== '') {
      const newMessage = { 
        role: 'user' as const, 
        content: comment,
        timestamp: new Date()
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      onUpdate(popup.id, updatedMessages);
      updatePopup(popup.id, { messages: updatedMessages });
      setComment('');
    }
  };

  const handleClose = () => {
    onClose(popup.id);
    closePopup(popup.id);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deletePopup(popup.id);
      toast({
        title: "Comment deleted",
        description: "The comment has been permanently deleted.",
      });
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleGoToLine = async () => {
    console.log('Go to line clicked with enhanced validation:', {
      chapterId: popup.chapterId,
      lineNumber: popup.lineNumber,
      type: typeof popup.lineNumber,
      isValidChapterId: !!popup.chapterId,
      isValidLineNumber: popup.lineNumber !== null && popup.lineNumber !== undefined && popup.lineNumber > 0
    });

    // Clear any previous error
    setNavigationError(null);

    // Enhanced validation with specific error messages
    if (!popup.chapterId) {
      const error = "Cannot navigate - missing chapter information";
      setNavigationError(error);
      console.warn(error);
      toast({
        title: "Navigation Error",
        description: error,
        variant: "destructive"
      });
      return;
    }

    if (!popup.lineNumber || popup.lineNumber < 1) {
      const error = "Cannot navigate - missing or invalid line number";
      setNavigationError(error);
      console.warn(error, { lineNumber: popup.lineNumber });
      toast({
        title: "Navigation Error", 
        description: error,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Executing goToLine with validated data:', { 
        chapterId: popup.chapterId, 
        lineNumber: popup.lineNumber 
      });
      
      await goToLine(popup.chapterId, popup.lineNumber);
      
      // Show success feedback
      toast({
        title: "Navigation Success",
        description: `Navigated to line ${popup.lineNumber}`,
      });
    } catch (error) {
      const errorMsg = "Navigation failed due to an unexpected error";
      setNavigationError(errorMsg);
      console.error('Go to line error:', error);
      toast({
        title: "Navigation Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  // Enhanced button visibility logic with comprehensive checking
  const hasValidNavigationData = Boolean(
    popup.chapterId && 
    popup.lineNumber !== null && 
    popup.lineNumber !== undefined && 
    popup.lineNumber > 0
  );

  console.log('Enhanced button visibility check:', {
    shouldShow: hasValidNavigationData,
    chapterId: popup.chapterId,
    lineNumber: popup.lineNumber,
    lineNumberType: typeof popup.lineNumber,
    hasError: !!navigationError
  });

  return (
    <div
      className="fixed z-50"
      style={{
        left: popup.position.x,
        top: popup.position.y,
        width: '320px'
      }}
    >
      <Card className="shadow-xl border-slate-300">
        {/* Enhanced Draggable Header with navigation info */}
        <div 
          className="bg-blue-50 border-b border-blue-200 p-3 cursor-move flex items-center gap-3 rounded-t-lg hover:bg-blue-100 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-blue-800">Comment</h3>
            <div className="text-xs text-blue-600">
              {popup.lineNumber ? (
                <span>Line {popup.lineNumber}</span>
              ) : (
                <span className="text-orange-600">No line info</span>
              )}
              {popup.chapterId && (
                <span className="ml-2 opacity-60">• Chapter linked</span>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button 
              onClick={handleDelete} 
              variant={showDeleteConfirm ? "destructive" : "ghost"} 
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            <Button onClick={handleClose} variant="ghost" size="sm" className="h-6 w-6 p-0">
              ×
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Show selected text context with line info */}
          {popup.selectedText && (
            <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-200 rounded text-sm">
              <div className="text-blue-800 font-medium mb-1">
                Selected text {popup.lineNumber ? `from line ${popup.lineNumber}` : ''}:
              </div>
              <div className="text-blue-700 italic">"{popup.selectedText}"</div>
            </div>
          )}

          {/* Show navigation error if any */}
          {navigationError && (
            <div className="mb-3 p-2 bg-red-50 border-l-4 border-red-200 rounded text-sm">
              <div className="text-red-800 font-medium">Navigation Error:</div>
              <div className="text-red-700">{navigationError}</div>
            </div>
          )}

          <div className="mb-2">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 p-2 rounded-md ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Add your comment..."
            className="mb-2 resize-none text-sm"
            rows={3}
          />
          <Button onClick={handleAddComment} className="w-full mb-2 bg-blue-600 hover:bg-blue-700" size="sm">
            Add Comment
          </Button>
          
          {/* Enhanced Go to Line button with better error states */}
          {hasValidNavigationData ? (
            <Button 
              onClick={handleGoToLine} 
              className="w-full mb-2" 
              variant="secondary" 
              size="sm"
              disabled={!!navigationError}
            >
              <MapPin className="w-4 h-4 mr-1" />
              Go to Line {popup.lineNumber}
            </Button>
          ) : (
            <Button 
              className="w-full mb-2" 
              variant="outline" 
              size="sm"
              disabled
              title="Navigation data not available"
            >
              <MapPin className="w-4 h-4 mr-1 opacity-50" />
              Navigation Unavailable
            </Button>
          )}
          
          {/* Enhanced debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
              Debug: Chapter={popup.chapterId || 'none'}, Line={popup.lineNumber ?? 'none'}, 
              Valid={hasValidNavigationData.toString()}, Error={navigationError || 'none'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between p-4">
          <Button 
            onClick={handleDelete} 
            variant={showDeleteConfirm ? "destructive" : "ghost"} 
            size="sm"
            className="flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            {showDeleteConfirm ? "Confirm Delete" : "Delete"}
          </Button>
          <Button onClick={handleClose} variant="ghost" size="sm">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SimpleCommentBox;
