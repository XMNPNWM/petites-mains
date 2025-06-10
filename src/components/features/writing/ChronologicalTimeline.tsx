
import React from 'react';
import { useTimelineData } from './timeline/hooks/useTimelineData';
import { useTimelineVisibility } from './timeline/hooks/useTimelineVisibility';
import TimelineIndicator from './timeline/components/TimelineIndicator';
import TimelineContent from './timeline/components/TimelineContent';

interface ChronologicalTimelineProps {
  projectId: string;
}

const ChronologicalTimeline = ({ projectId }: ChronologicalTimelineProps) => {
  const { sortedChats, isLoading, hasTimelineData } = useTimelineData(projectId);
  const { isHovered, handleMouseEnter, handleMouseLeave } = useTimelineVisibility();

  return (
    <div
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Larger invisible hover area for better UX */}
      <div className="absolute inset-0 -m-4 z-0" />
      
      {/* Always visible subtle indicator */}
      <TimelineIndicator isVisible={isHovered} />

      {/* Full timeline that appears on hover */}
      <TimelineContent
        isVisible={isHovered}
        hasTimelineData={hasTimelineData}
        isLoading={isLoading}
        sortedChats={sortedChats}
        projectId={projectId}
      />
    </div>
  );
};

export default ChronologicalTimeline;
