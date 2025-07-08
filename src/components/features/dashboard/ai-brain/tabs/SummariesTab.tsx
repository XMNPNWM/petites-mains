import React from 'react';
import { FileText } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { SummaryCard } from '../cards/SummaryCard';

export const SummariesTab: React.FC<TabComponentProps> = ({
  data,
  onUpdateChapterSummary
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No chapter summaries available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((summary) => (
        <SummaryCard
          key={summary.id}
          item={summary}
          onUpdateTitle={(id, value) => onUpdateChapterSummary(id, 'title', value)}
          onUpdateSummary={(id, value) => onUpdateChapterSummary(id, 'summary_long', value)}
        />
      ))}
    </div>
  );
};