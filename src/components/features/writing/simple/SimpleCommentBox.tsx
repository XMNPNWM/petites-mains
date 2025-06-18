
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useSimplePopups } from './SimplePopupManager';
import { toast } from '@/hooks/use-toast';
import { useDragBehavior } from './hooks/useDragBehavior';
import CommentBoxHeader from './components/CommentBoxHeader';
import CommentBoxContent from './components/CommentBoxContent';

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
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const { updatePopup, closePopup, deletePopup, goToLine } = useSimplePopups();

  const { handleMouseDown } = useDragBehavior({
    popupId: popup.id,
    initialPosition: popup.position,
    onPositionUpdate: (id, position) => updatePopup(id, { position })
  });

  useEffect(() => {
    setMessages(popup.messages || []);
  }, [popup.messages]);

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
      isValid: popup.chapterId && popup.lineNumber !== null && popup.lineNumber !== undefined && popup.lineNumber > 0
    });

    setNavigationError(null);

    if (!popup.chapterId || !popup.lineNumber || popup.lineNumber < 1) {
      const error = "Navigation data not available";
      setNavigationError(error);
      console.warn('Navigation blocked:', error);
      toast({
        title: "Navigation Not Available",
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
      
      await goToLine(popup.chapterId!, popup.lineNumber!);
      
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
        <CommentBoxHeader
          popup={popup}
          showDeleteConfirm={showDeleteConfirm}
          onMouseDown={handleMouseDown}
          onDelete={handleDelete}
          onClose={handleClose}
        />

        <CardContent className="p-0">
          <CommentBoxContent
            popup={popup}
            messages={messages}
            comment={comment}
            navigationError={navigationError}
            onCommentChange={handleCommentChange}
            onAddComment={handleAddComment}
            onGoToLine={handleGoToLine}
          />
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
