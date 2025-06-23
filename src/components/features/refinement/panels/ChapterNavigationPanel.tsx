
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { FileText, Clock } from 'lucide-react';
import ChapterStatusSelector from '@/components/features/writing/ChapterStatusSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface ChapterNavigationPanelProps {
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onChapterSelect: (chapter: Chapter) => void;
}

const ChapterNavigationPanel = ({
  chapters,
  currentChapter,
  onChapterSelect
}: ChapterNavigationPanelProps) => {
  const { toast } = useToast();
  
  // Sort chapters by order_index and create display numbers starting from 1
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);

  const handleStatusChange = async (chapterId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ status: newStatus })
        .eq('id', chapterId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Chapter status updated successfully",
      });
    } catch (error) {
      console.error('Error updating chapter status:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter status",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>Chapters ({chapters.length})</span>
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sortedChapters.map((chapter, index) => (
            <Card 
              key={chapter.id}
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                currentChapter?.id === chapter.id 
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onChapterSelect(chapter)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Chapter {index + 1}
                  </span>
                  <ChapterStatusSelector
                    status={chapter.status}
                    onStatusChange={(status) => handleStatusChange(chapter.id, status)}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-900 text-sm leading-tight mb-1">
                    {chapter.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{chapter.word_count || 0} words</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ChapterNavigationPanel;
