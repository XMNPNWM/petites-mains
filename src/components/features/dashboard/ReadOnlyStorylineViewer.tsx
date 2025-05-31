
import React from 'react';
import { useReadOnlyStorylineViewer } from '@/hooks/useReadOnlyStorylineViewer';
import EmptyStorylineState from './storyline/EmptyStorylineState';
import StorylineViewerHeader from './storyline/StorylineViewerHeader';
import StorylineCanvas from './storyline/StorylineCanvas';

interface ReadOnlyStorylineViewerProps {
  projectId: string;
}

const ReadOnlyStorylineViewer = ({ projectId }: ReadOnlyStorylineViewerProps) => {
  const {
    nodes,
    connections,
    zoom,
    pan,
    handleZoomIn,
    handleZoomOut,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView
  } = useReadOnlyStorylineViewer(projectId);

  if (nodes.length === 0) {
    return <EmptyStorylineState />;
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <StorylineViewerHeader
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={resetView}
      />

      <StorylineCanvas
        nodes={nodes}
        connections={connections}
        zoom={zoom}
        pan={pan}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default ReadOnlyStorylineViewer;
