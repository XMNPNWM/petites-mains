
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { stripHtmlTags, getWordCount } from '@/lib/contentUtils';
import FocusModeToggle from './FocusModeToggle';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface TextEditorPanelProps {
  chapter: Chapter | null;
  onContentChange: (content: string) => void;
  isFocusMode?: boolean;
  onFocusToggle?: () => void;
}

const TextEditorPanel = ({ 
  chapter, 
  onContentChange, 
  isFocusMode = false, 
  onFocusToggle 
}: TextEditorPanelProps) => {
  const cleanContent = chapter?.content ? stripHtmlTags(chapter.content) : '';
  const wordCount = getWordCount(cleanContent);

  const handleContentChange = (newContent: string) => {
    // Pass the plain text content
    onContentChange(newContent);
  };

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col overflow-hidden">
      {chapter ? (
        <>
          {/* Chapter Header */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{chapter.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>{wordCount} words</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    chapter.status === 'published' ? 'bg-green-100 text-green-700' :
                    chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chapter.status}
                  </span>
                </div>
              </div>
              {onFocusToggle && (
                <FocusModeToggle 
                  isFocusMode={isFocusMode} 
                  onToggle={onFocusToggle} 
                />
              )}
            </div>
          </div>

          {/* Editor */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
              <Textarea
                value={cleanContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing your story..."
                className="flex-1 resize-none border-none focus-visible:ring-0 text-base leading-relaxed overflow-y-auto"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <p className="text-slate-500 text-lg mb-4">No chapter selected</p>
            <p className="text-slate-400">Select a chapter from the organizer to start writing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextEditorPanel;
