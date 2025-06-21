
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'updated':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'updated':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="h-full bg-slate-50 p-4 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Chapters</h3>
        <p className="text-xs text-slate-500">
          {chapters.length} chapters total
        </p>
      </div>
      
      <div className="space-y-2">
        {chapters.map((chapter) => {
          const isSelected = currentChapter?.id === chapter.id;
          
          return (
            <Card
              key={chapter.id}
              className={`p-3 cursor-pointer transition-colors hover:bg-white ${
                isSelected 
                  ? 'bg-white border-purple-200 shadow-sm' 
                  : 'bg-slate-50 hover:bg-white'
              }`}
              onClick={() => onChapterSelect(chapter)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(chapter.status)}
                  <span className="text-xs font-medium text-slate-600">
                    Chapter {chapter.order_index + 1}
                  </span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-2 py-1 ${getStatusColor(chapter.status)}`}
                >
                  {chapter.status || 'untouched'}
                </Badge>
              </div>
              
              <h4 className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">
                {chapter.title}
              </h4>
              
              <p className="text-xs text-slate-500">
                {chapter.word_count || 0} words
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterNavigationPanel;
