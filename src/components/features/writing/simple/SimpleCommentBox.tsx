
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Trash2, MapPin } from 'lucide-react';
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
  const { updatePopup, closePopup, deletePopup, goToLine } = useSimplePopups();

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
      setTimeout(() => setShowDeleteConfirm(false), 3000); // Reset after 3 seconds
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
    <Card className="w-80 shadow-md">
      <CardContent className="p-4">
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
        />
        <Button onClick={handleAddComment} className="w-full mb-2" size="sm">
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
  );
};

export default SimpleCommentBox;
