
import { useState, useCallback } from 'react';
import { ViewportState } from '../types';
import { calculateViewportCenter } from '../utils/viewportUtils';
import { StorylineNode } from '../types';

export const useViewportControls = (nodes: StorylineNode[], initialPan: { x: number; y: number }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(initialPan);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.3));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(3, Math.max(0.3, prev + delta)));
  }, []);

  // Canvas panning
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if clicking on canvas background, not on nodes
    if ((e.target as HTMLElement).closest('.storyline-node')) return;
    
    // Deselect any selected node when clicking on empty canvas
    setSelectedNode(null);
    
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => {
    if (nodes.length > 0) {
      const centerPosition = calculateViewportCenter(nodes);
      setPan(centerPosition);
    } else {
      setPan({ x: 0, y: 0 });
    }
    setZoom(1);
  };

  // Navigation function for worldbuilding elements
  const navigateToNode = useCallback((nodeId: string, targetPosition: { x: number; y: number }) => {
    console.log('useViewportControls: Navigating to node', nodeId, 'at position', targetPosition);
    
    // Calculate the canvas center (assuming standard canvas dimensions)
    const canvasWidth = window.innerWidth * 0.7; // Approximate canvas width
    const canvasHeight = window.innerHeight * 0.8; // Approximate canvas height
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    
    // Calculate the pan needed to center the target position
    const newPan = {
      x: canvasCenterX - (targetPosition.x * zoom),
      y: canvasCenterY - (targetPosition.y * zoom)
    };
    
    console.log('useViewportControls: Setting new pan:', newPan);
    setPan(newPan);
    
    // Ensure the node is selected for visual feedback
    setSelectedNode(nodeId);
  }, [zoom]);

  return {
    zoom,
    pan,
    draggedNode,
    selectedNode,
    setPan,
    setDraggedNode,
    setSelectedNode,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    resetView,
    navigateToNode
  };
};
