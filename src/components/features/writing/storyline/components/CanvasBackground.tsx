
import React from 'react';

interface CanvasBackgroundProps {
  zoom: number;
  pan: { x: number; y: number };
  children: React.ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
}

const CanvasBackground = React.memo(({
  zoom,
  pan,
  children,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}: CanvasBackgroundProps) => {
  return (
    <div 
      className="flex-1 relative bg-slate-50 cursor-grab active:cursor-grabbing select-none overflow-hidden"
      data-storyline-canvas="true"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        // Infinite grid background using CSS
        backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      unselectable="on"
    >
      {children}
    </div>
  );
});

CanvasBackground.displayName = 'CanvasBackground';

export default CanvasBackground;
