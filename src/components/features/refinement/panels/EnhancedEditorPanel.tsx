
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

interface EnhancedEditorPanelProps {
  content: string;
  onContentChange: (content: string) => void;
  chapterTitle: string;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  onImportToCreation?: () => void;
}

const EnhancedEditorPanel = ({ 
  content, 
  onContentChange, 
  chapterTitle,
  onScrollSync,
  scrollPosition,
  onImportToCreation
}: EnhancedEditorPanelProps) => {
  return (
    <div className="h-full bg-slate-50 p-4 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-slate-700">Enhanced Editor</h3>
        </div>
        {onImportToCreation && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center space-x-1"
            onClick={onImportToCreation}
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-xs">Import to Creation Editor</span>
          </Button>
        )}
      </div>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">
            {chapterTitle || 'No chapter selected'} - AI Enhanced
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-0 flex flex-col">
          <RichTextEditor
            content={content}
            onContentChange={onContentChange}
            onScrollSync={onScrollSync}
            scrollPosition={scrollPosition}
            placeholder="AI-enhanced content will appear here..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedEditorPanel;
