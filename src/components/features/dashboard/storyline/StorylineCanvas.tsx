
import React from 'react';
import StorylineGrid from './StorylineGrid';
import StorylineConnections from './StorylineConnections';
import StorylineNodes from './StorylineNodes';

interface StorylineNode {
  id: string;
  title: string;
  content: string;
  node_type: string;
  position: { x: number; y: number };
}

interface StorylineConnection {
  id: string;
  source_id: string;
  target_id: string;
  label: string;
}

interface StorylineCanvasProps {
  nodes: StorylineNode[];
  connections: StorylineConnection[];
  zoom: number;
  pan: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
}

const StorylineCanvas = ({
  nodes,
  connections,
  zoom,
  pan,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}: StorylineCanvasProps) => {
  return (
    <div 
      className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <StorylineGrid />
        
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          style={{ minWidth: '8000px', minHeight: '8000px' }}
        >
          <StorylineConnections connections={connections} nodes={nodes} />
        </svg>

        <StorylineNodes nodes={nodes} />
      </div>
    </div>
  );
};

export default StorylineCanvas;
