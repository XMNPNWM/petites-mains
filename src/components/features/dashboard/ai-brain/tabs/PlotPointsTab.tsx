import React from 'react';
import { BookOpen } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditablePlotCard } from '../cards/EditablePlotCard';

export const PlotPointsTab: React.FC<TabComponentProps> = ({
  data,
  onUpdatePlotPoint,
  onTogglePlotPointFlag
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No plot points found with current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((plotPoint) => (
        <EditablePlotCard
          key={plotPoint.id}
          item={plotPoint}
          onUpdateName={(id, value) => onUpdatePlotPoint(id, 'name', value)}
          onUpdateDescription={(id, value) => onUpdatePlotPoint(id, 'description', value)}
          onToggleFlag={onTogglePlotPointFlag}
          type="plot-point"
        />
      ))}
    </div>
  );
};