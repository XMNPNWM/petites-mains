
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { hasValidNavigationData, getNavigationStatusMessage } from '../utils/navigationUtils';

interface CommentBoxContentProps {
  popup: {
    selectedText: string | null;
    lineNumber: number | null;
    chapterId?: string;
  };
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  comment: string;
  navigationError: string | null;
  onCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAddComment: () => void;
  onGoToLine: () => void;
}

const CommentBoxContent = ({
  popup,
  messages,
  comment,
  navigationError,
  onCommentChange,
  onAddComment,
  onGoToLine
}: CommentBoxContentProps) => {
  const hasValidNavigation = hasValidNavigationData(popup.chapterId, popup.lineNumber);
  const statusMessage = getNavigationStatusMessage(popup.chapterId, popup.lineNumber);

  return (
    <div className="p-4">
      {/* Enhanced selected text context display */}
      {popup.selectedText && (
        <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-200 rounded text-sm">
          <div className="text-blue-800 font-medium mb-1">
            Selected text {popup.lineNumber ? `from line ${popup.lineNumber}` : '(no line info)'}:
          </div>
          <div className="text-blue-700 italic">"{popup.selectedText}"</div>
        </div>
      )}

      {/* Show navigation status message if no valid data */}
      {!hasValidNavigation && (
        <div className="mb-3 p-2 bg-orange-50 border-l-4 border-orange-200 rounded text-sm">
          <div className="text-orange-800 font-medium">Navigation Status:</div>
          <div className="text-orange-700">{statusMessage}</div>
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
        onChange={onCommentChange}
        placeholder="Add your comment..."
        className="mb-2 resize-none text-sm"
        rows={3}
      />
      <Button onClick={onAddComment} className="w-full mb-2 bg-blue-600 hover:bg-blue-700" size="sm">
        Add Comment
      </Button>
      
      {/* Enhanced Go to Line button with clear status indication */}
      {hasValidNavigation ? (
        <Button 
          onClick={onGoToLine} 
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
          title={statusMessage}
        >
          <MapPin className="w-4 h-4 mr-1 opacity-50" />
          Navigation Unavailable
        </Button>
      )}
      
      {/* Enhanced debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
          Debug: Chapter={popup.chapterId || 'none'}, Line={popup.lineNumber ?? 'none'}, 
          Valid={hasValidNavigation.toString()}, Status="{statusMessage || 'ready'}"
        </div>
      )}
    </div>
  );
};

export default CommentBoxContent;
