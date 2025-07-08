import React from 'react';
import { GitBranch } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditablePlotCard } from '../cards/EditablePlotCard';

export const PlotThreadsTab: React.FC<TabComponentProps> = ({
  data,
  onUpdatePlotThread,
  onTogglePlotThreadFlag
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No plot threads found with current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((thread) => (
        <EditablePlotCard
          key={thread.id}
          item={thread}
          onUpdateName={(id, value) => onUpdatePlotThread(id, value)}
          onToggleFlag={onTogglePlotThreadFlag}
          type="plot-thread"
        />
      ))}
    </div>
  );
};