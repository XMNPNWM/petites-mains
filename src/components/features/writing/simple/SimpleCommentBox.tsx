
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
  chapterId: string;
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
  const { updatePopup, closePopup, deletePopup, goToLine } = useSimplePopups();
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(popup.messages || []);
  }, [popup.messages]);

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== dragRef.current) return;
    
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

  const handleGoToLine = () => {
    if (popup.chapterId && popup.lineNumber) {
      console.log('Going to line from comment:', { chapterId: popup.chapterId, lineNumber: popup.lineNumber });
      goToLine(popup.chapterId, popup.lineNumber);
    } else {
      console.warn('Missing chapter ID or line number for navigation');
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
        {/* Draggable Header */}
        <div 
          ref={dragRef}
          className="bg-blue-50 border-b border-blue-200 p-3 cursor-move flex items-center gap-2 rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-blue-800">Comment</h3>
            {popup.lineNumber && (
              <span className="text-xs text-blue-600">Line {popup.lineNumber}</span>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Show selected text context */}
          {popup.selectedText && (
            <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-200 rounded text-sm">
              <div className="text-blue-800 font-medium mb-1">Selected text:</div>
              <div className="text-blue-700 italic">"{popup.selectedText}"</div>
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
          {popup.lineNumber !== null && (
            <Button onClick={handleGoToLine} className="w-full mb-2" variant="secondary" size="sm">
              <MapPin className="w-4 h-4 mr-1" />
              Go to Line {popup.lineNumber}
            </Button>
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
