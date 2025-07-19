
import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, RefreshCw } from 'lucide-react';
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
    console.log('ExportDocumentEditor: Content changed, length:', newContent.length);
    onContentChange(newContent);
  }, [onContentChange]);

  const handleEditorReady = useCallback((editor: any) => {
    console.log('ExportDocumentEditor: Editor ready, current content length:', content.length);
  }, [content.length]);

  // Debug content changes
  useEffect(() => {
    console.log('ExportDocumentEditor: Content prop updated', {
      contentLength: content.length,
      isLoading,
      hasContent: !!content,
      contentPreview: content.substring(0, 100)
    });
  }, [content, isLoading]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Assembling document...</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please wait while we prepare your content
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if no content is available
  if (!content && !isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <Info className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">No Content Available</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The document content hasn't been assembled yet.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
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
          <div className="flex items-center space-x-2">
            {!isReadOnly && (
              <div className="text-sm text-muted-foreground">
                Editable Preview
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} characters
            </div>
          </div>
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
