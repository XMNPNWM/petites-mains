import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History, RotateCcw, FileText, Sparkles, Loader2 } from 'lucide-react';
import { ContentVersioningService, ContentVersion } from '@/services/ContentVersioningService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ContentHistoryDialogProps {
  chapterId: string;
  chapterTitle: string;
}

const ContentHistoryDialog = ({ chapterId, chapterTitle }: ContentHistoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const { toast } = useToast();

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const data = await ContentVersioningService.getContentHistory(chapterId);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast({
        title: "Error",
        description: "Failed to load content history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setIsRestoring(versionId);
    try {
      const result = await ContentVersioningService.restoreContentVersion(versionId);
      
      if (result.success) {
        toast({
          title: "Version Restored",
          description: "Content has been restored to the selected version. A backup was created automatically.",
        });
        setIsOpen(false);
        // Reload the page or refresh the content
        window.location.reload();
      } else {
        throw new Error(result.error || 'Restore failed');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore version",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen]);

  const getVersionTypeIcon = (contentType: string) => {
    return contentType === 'enhancement' ? Sparkles : FileText;
  };

  const getVersionTypeColor = (contentType: string) => {
    return contentType === 'enhancement' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <History className="w-4 h-4" />
          <span className="ml-1 text-xs">History</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Content History - {chapterTitle}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No version history available for this chapter.
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => {
                const Icon = getVersionTypeIcon(version.content_type);
                const isLatest = index === 0;
                
                return (
                  <div key={version.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <Badge 
                            variant="secondary" 
                            className={getVersionTypeColor(version.content_type)}
                          >
                            {version.content_type === 'enhancement' ? 'Enhancement' : 'Creation'} v{version.version_number}
                          </Badge>
                          {isLatest && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(version.created_at), 'MMM d, yyyy at h:mm a')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {version.word_count && (
                          <span className="text-xs text-muted-foreground">
                            {version.word_count} words
                          </span>
                        )}
                        {!isLatest && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(version.id)}
                            disabled={isRestoring === version.id}
                            className="h-7 px-2"
                          >
                            {isRestoring === version.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span className="ml-1 text-xs">Restore</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {version.change_summary && (
                      <div className="text-sm">
                        <strong>Summary:</strong> {version.change_summary}
                      </div>
                    )}

                    {version.user_notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {version.user_notes}
                      </div>
                    )}

                    {version.enhancement_options && Object.keys(version.enhancement_options).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Enhancement options: {JSON.stringify(version.enhancement_options)}
                      </div>
                    )}

                    <Separator />
                    
                    <div className="text-sm bg-muted p-3 rounded max-h-32 overflow-auto">
                      {version.content.substring(0, 300)}
                      {version.content.length > 300 && '...'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ContentHistoryDialog;