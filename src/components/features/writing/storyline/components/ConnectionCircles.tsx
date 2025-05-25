
import React from 'react';
import { CONNECTION_CIRCLE_OFFSET } from '../constants/nodeConstants';

interface ConnectionCirclesProps {
  onCircleClick: (e: React.MouseEvent, position: 'top' | 'right' | 'bottom' | 'left') => void;
}

const ConnectionCircles = React.memo(({ onCircleClick }: ConnectionCirclesProps) => {
  const circleClassName = "absolute w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600 border border-white shadow-sm";

  return (
    <>
      {/* Top Circle */}
      <div
        className={circleClassName}
        style={{
          left: '50%',
          top: `-${CONNECTION_CIRCLE_OFFSET}px`,
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => onCircleClick(e, 'top')}
        title="Create connection from top"
      />

      {/* Right Circle */}
      <div
        className={circleClassName}
        style={{
          right: `-${CONNECTION_CIRCLE_OFFSET}px`,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseDown={(e) => onCircleClick(e, 'right')}
        title="Create connection from right"
      />

      {/* Bottom Circle */}
      <div
        className={circleClassName}
        style={{
          left: '50%',
          bottom: `-${CONNECTION_CIRCLE_OFFSET}px`,
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => onCircleClick(e, 'bottom')}
        title="Create connection from bottom"
      />

      {/* Left Circle */}
      <div
        className={circleClassName}
        style={{
          left: `-${CONNECTION_CIRCLE_OFFSET}px`,
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseDown={(e) => onCircleClick(e, 'left')}
        title="Create connection from left"
      />
    </>
  );
});

ConnectionCircles.displayName = 'ConnectionCircles';

export default ConnectionCircles;
