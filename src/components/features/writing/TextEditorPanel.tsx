
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
}

interface TextEditorPanelProps {
  chapter: Chapter | null;
  onContentChange: (content: string) => void;
}

const TextEditorPanel = ({ chapter, onContentChange }: TextEditorPanelProps) => {
  const wordCount = chapter?.content ? 
    chapter.content.split(' ').filter(word => word.length > 0).length : 0;

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col">
      {chapter ? (
        <>
          {/* Chapter Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">{chapter.title}</h2>
            <p className="text-sm text-slate-600">{wordCount} words</p>
          </div>

          {/* Editor */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <Textarea
                value={chapter.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Start writing your story..."
                className="flex-1 resize-none border-none focus-visible:ring-0 text-base leading-relaxed"
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
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
