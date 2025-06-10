
import React from 'react';

interface TimelineIndicatorProps {
  isVisible: boolean;
}

const TimelineIndicator = ({ isVisible }: TimelineIndicatorProps) => {
  return (
    <div className={`flex items-center justify-center transition-all duration-300 ${
      isVisible 
        ? 'opacity-0' 
        : 'opacity-40'
    }`}>
      <div className="h-1 w-48 bg-slate-300 rounded-full"></div>
    </div>
  );
};

export default TimelineIndicator;
