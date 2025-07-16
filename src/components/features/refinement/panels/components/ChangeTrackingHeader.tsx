
import React from 'react';
import { Eye } from 'lucide-react';
import ContentHistoryDialog from '../../components/ContentHistoryDialog';

interface ChangeTrackingHeaderProps {
  changesCount: number;
  chapterId?: string;
  chapterTitle?: string;
}

const ChangeTrackingHeader = ({ changesCount, chapterId, chapterTitle }: ChangeTrackingHeaderProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-700">Change Tracking</h3>
        </div>
        {chapterId && chapterTitle && (
          <ContentHistoryDialog chapterId={chapterId} chapterTitle={chapterTitle} />
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {changesCount} AI suggestions
      </p>
    </div>
  );
};

export default ChangeTrackingHeader;
