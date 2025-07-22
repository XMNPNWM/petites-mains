import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditorCore from '../components/EditorCore';
import { RefinementData } from '@/types/shared';

interface OriginalEditorPanelProps {
  refinementData: RefinementData | null;
  highlightedRange?: { start: number; end: number } | null;
  chapterId: string;
}

const OriginalEditorPanel = ({
  refinementData,
  highlightedRange,
  chapterId
}: OriginalEditorPanelProps) => {
  const originalContent = refinementData?.original_content || '';

  return (
    <div className="h-full bg-background">
      <Card className="h-full border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Original Content
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)] p-0">
          <div className="h-full border rounded-md bg-muted/30">
            <EditorCore
              content={originalContent}
              onContentChange={() => {}} // Read-only
              readOnly={true}
              chapterKey={`original-${chapterId}`}
              placeholder="No original content available"
              highlightedRange={highlightedRange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OriginalEditorPanel;