
import React, { useCallback } from 'react';
import StorylineNode from './StorylineNode';

interface StorylineNodeData {
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
  nodes: StorylineNodeData[];
  connections: StorylineConnection[];
  zoom: number;
  pan: { x: number; y: number };
  draggedNode: string | null;
  onNodeEdit: (node: StorylineNodeData) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onCanvasMouseDown: (e: React.MouseEvent) => void;
  onCanvasMouseMove: (e: React.MouseEvent) => void;
  onCanvasMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  setDraggedNode: (nodeId: string | null) => void;
}

const StorylineCanvas = ({
  nodes,
  connections,
  zoom,
  pan,
  draggedNode,
  onNodeEdit,
  onNodeDelete,
  onNodeDrag,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onWheel,
  setDraggedNode
}: StorylineCanvasProps) => {
  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [pan, zoom]);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, node: StorylineNodeData) => {
    e.stopPropagation(); // Prevent canvas panning when dragging nodes
    setDraggedNode(node.id);
    
    // Get the container element to calculate proper bounds
    const container = e.currentTarget.closest('.flex-1') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the initial offset between mouse and node position in world coordinates
    const mouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
    const dragOffset = {
      x: mouseWorldPos.x - node.position.x,
      y: mouseWorldPos.y - node.position.y
    };

    console.log('Drag start:', {
      mouseScreen: { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top },
      mouseWorld: mouseWorldPos,
      nodePos: node.position,
      offset: dragOffset,
      pan,
      zoom
    });

    const handleMouseMove = (e: MouseEvent) => {
      // Convert current mouse position to world coordinates
      const currentMouseWorldPos = screenToWorld(e.clientX - containerRect.left, e.clientY - containerRect.top);
      
      // Calculate new node position by subtracting the initial offset
      const newPosition = {
        x: currentMouseWorldPos.x - dragOffset.x,
        y: currentMouseWorldPos.y - dragOffset.y
      };

      console.log('Drag move:', {
        mouseScreen: { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top },
        mouseWorld: currentMouseWorldPos,
        newPos: newPosition
      });

      onNodeDrag(node.id, newPosition);
    };

    const handleMouseUp = () => {
      setDraggedNode(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [screenToWorld, setDraggedNode, onNodeDrag, pan, zoom]);

  return (
    <div 
      className="flex-1 relative overflow-hidden bg-slate-50 cursor-grab active:cursor-grabbing"
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseUp}
      onWheel={onWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connections */}
          {connections.map((connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source_id);
            const targetNode = nodes.find(n => n.id === connection.target_id);
            if (!sourceNode || !targetNode) return null;
            
            return (
              <line
                key={connection.id}
                x1={sourceNode.position.x + 60}
                y1={sourceNode.position.y + 30}
                x2={targetNode.position.x + 60}
                y2={targetNode.position.y + 30}
                stroke="rgba(148, 163, 184, 0.6)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <StorylineNode
            key={node.id}
            node={node}
            isDragged={draggedNode === node.id}
            onEdit={onNodeEdit}
            onDelete={onNodeDelete}
            onDragStart={handleNodeDragStart}
          />
        ))}
      </div>
    </div>
  );
};

export default StorylineCanvas;
