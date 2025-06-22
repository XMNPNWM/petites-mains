
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { FileText, Clock } from 'lucide-react';

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
  // Sort chapters by order_index and create display numbers starting from 1
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'draft':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="h-full">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>Chapters ({chapters.length})</span>
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedChapters.map((chapter, index) => (
            <Button
              key={chapter.id}
              variant={currentChapter?.id === chapter.id ? "default" : "ghost"}
              className="w-full mb-2 p-3 h-auto flex flex-col items-start space-y-2"
              onClick={() => onChapterSelect(chapter)}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">
                  Chapter {index + 1}
                </span>
                <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(chapter.status)}`}>
                  {formatStatus(chapter.status)}
                </div>
              </div>
              
              <div className="text-left w-full">
                <p className="text-sm font-medium truncate">
                  {chapter.title}
                </p>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{chapter.word_count} words</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ChapterNavigationPanel;
