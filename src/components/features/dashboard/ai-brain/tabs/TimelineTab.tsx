import React from 'react';
import { Calendar } from 'lucide-react';
import { TabComponentProps } from '@/types/ai-brain-tabs';
import { EditableTimelineCard } from '../cards/EditableTimelineCard';

export const TimelineTab: React.FC<TabComponentProps> = ({
  data,
  onUpdateTimelineEvent,
  onToggleTimelineEventFlag,
  onDeleteTimelineEvent,
  onUpdateTimelineEventType
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No timeline events found with current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((event) => (
        <EditableTimelineCard
          key={event.id}
          item={event}
          onUpdateEventName={(id, value) => onUpdateTimelineEvent(id, 'event_name', value)}
          onUpdateEventDescription={(id, value) => onUpdateTimelineEvent(id, 'event_description', value)}
          onToggleFlag={onToggleTimelineEventFlag}
          onDelete={onDeleteTimelineEvent}
          onUpdateEventType={onUpdateTimelineEventType}
        />
      ))}
    </div>
  );
};