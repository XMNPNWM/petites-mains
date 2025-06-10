
import React from 'react';
import { format } from 'date-fns';
import TimelineControls from './TimelineControls';
import TimelineBlocks from './TimelineBlocks';
import { TimelineChat } from '../types';

interface TimelineContentProps {
  isVisible: boolean;
  hasTimelineData: boolean;
  isLoading: boolean;
  sortedChats: TimelineChat[];
  projectId: string;
}

const TimelineContent = ({ 
  isVisible, 
  hasTimelineData, 
  isLoading, 
  sortedChats, 
  projectId 
}: TimelineContentProps) => {
  return (
    <div className={`flex items-center justify-center transition-all duration-300 absolute inset-0 ${
      isVisible 
        ? 'opacity-100 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2' 
        : 'opacity-0 pointer-events-none'
    }`}>
      {isVisible && hasTimelineData && (
        <TimelineControls>
          <TimelineBlocks sortedChats={sortedChats} projectId={projectId} />
          
          {/* Time markers for timeline start and end */}
          {hasTimelineData && (
            <div className="absolute top-4 left-0 right-0 flex justify-between text-xs text-slate-500 pointer-events-none">
              <span>{format(new Date(sortedChats[0].created_at), 'MMM dd')}</span>
              {sortedChats.length > 1 && (
                <span>{format(new Date(sortedChats[sortedChats.length - 1].created_at), 'MMM dd')}</span>
              )}
            </div>
          )}
        </TimelineControls>
      )}
      
      {/* Message when no data and hovered */}
      {isVisible && !hasTimelineData && (
        <div className="px-4 py-2">
          <span className="text-xs text-slate-600 whitespace-nowrap">
            {isLoading ? 'Loading timeline...' : 'Timeline will appear here as you create comments'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineContent;
