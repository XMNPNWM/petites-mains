import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import EditorCore from '@/components/features/refinement/components/EditorCore';

interface ExportDocumentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
}

const ExportDocumentEditor = ({
  content,
  onContentChange,
  isReadOnly = false,
  isLoading = false
}: ExportDocumentEditorProps) => {
  const handleContentChange = useCallback((newContent: string) => {
    onContentChange(newContent);
  }, [onContentChange]);

  const handleEditorReady = useCallback((editor: any) => {
    console.log('Export document editor ready');
  }, []);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Assembling document...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Document Preview</CardTitle>
          {!isReadOnly && (
            <div className="text-sm text-muted-foreground">
              Editable Preview
            </div>
          )}
        </div>
        
        {!isReadOnly && (
          <Alert className="mt-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You can edit this document preview. Changes made here are for export only and won't sync back to your original chapters.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 min-h-0">
        <div className="h-full border-t border-border">
          <EditorCore
            content={content}
            onContentChange={handleContentChange}
            onEditorReady={handleEditorReady}
            placeholder="Document content will appear here..."
            readOnly={isReadOnly}
            chapterKey="export-document"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportDocumentEditor;