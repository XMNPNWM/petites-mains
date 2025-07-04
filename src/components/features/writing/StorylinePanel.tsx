
import React from 'react';
import StorylineControls from './storyline/StorylineControls';
import StorylineCanvas from './storyline/StorylineCanvas';
import NodeForm from './storyline/NodeForm';
import DeleteNodeDialog from './storyline/DeleteNodeDialog';
import { useStorylineData } from './storyline/hooks/useStorylineData';
import { useStorylineActions } from './storyline/hooks/useStorylineActions';
import { useViewportControls } from './storyline/hooks/useViewportControls';

interface StorylinePanelProps {
  projectId: string;
  chapterId?: string;
  onDataChange?: () => void;
}

const StorylinePanel = ({ projectId, chapterId, onDataChange }: StorylinePanelProps) => {
  const {
    nodes,
    connections,
    worldbuildingElements,
    pan: dataPan,
    fetchStorylineData,
    updateNodePosition,
    updateConnectionLabel
  } = useStorylineData(projectId);

  const {
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
  } = useViewportControls(nodes, dataPan);

  // Enhanced data change handler that triggers the parent callback
  const handleDataChange = React.useCallback(() => {
    console.log('StorylinePanel: Data changed, fetching and notifying parent...');
    fetchStorylineData();
    if (onDataChange) {
      onDataChange();
    }
  }, [fetchStorylineData, onDataChange]);

  const {
    editingNode,
    showNodeForm,
    nodeForm,
    deleteDialogState,
    connectionLabelState,
    connectionCreationState,
    setShowNodeForm,
    deleteNode,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleNodeEdit,
    resetForm,
    handleFormChange,
    handleFormSubmit,
    createNodeAtPosition,
    createNodeFromWorldbuilding,
    startEditingConnectionLabel,
    cancelEditingConnectionLabel,
    startConnectionCreation,
    updateConnectionPreview,
    finishConnectionCreation,
    cancelConnectionCreation,
    deleteConnection
  } = useStorylineActions(projectId, nodes, zoom, pan, handleDataChange);

  // Update pan when data pan changes
  React.useEffect(() => {
    setPan(dataPan);
  }, [dataPan, setPan]);

  const handleConnectionLabelSave = async (connectionId: string, label: string) => {
    await updateConnectionLabel(connectionId, label);
    cancelEditingConnectionLabel();
  };

  const handleConnectionDelete = async (connectionId: string) => {
    await deleteConnection(connectionId);
    cancelEditingConnectionLabel();
  };

  // Navigation handler for worldbuilding elements
  const handleNavigateToNode = React.useCallback((nodeId: string, position: { x: number; y: number }) => {
    console.log('StorylinePanel: Navigating to node:', nodeId, position);
    navigateToNode(nodeId, position);
    setSelectedNode(nodeId);
  }, [navigateToNode, setSelectedNode]);

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden relative z-[1000]">
      <div className="flex-shrink-0">
        <StorylineControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={resetView}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <StorylineCanvas
          nodes={nodes}
          connections={connections}
          worldbuildingElements={worldbuildingElements}
          zoom={zoom}
          pan={pan}
          draggedNode={draggedNode}
          selectedNode={selectedNode}
          connectionLabelState={connectionLabelState}
          connectionCreationState={connectionCreationState}
          onNodeEdit={handleNodeEdit}
          onNodeDelete={deleteNode}
          onNodeDrag={updateNodePosition}
          onCanvasMouseDown={handleCanvasMouseDown}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
          onCreateNode={createNodeAtPosition}
          onCreateFromWorldbuilding={createNodeFromWorldbuilding}
          onConnectionLabelEdit={startEditingConnectionLabel}
          onConnectionLabelSave={handleConnectionLabelSave}
          onConnectionLabelDelete={handleConnectionDelete}
          onConnectionLabelCancel={cancelEditingConnectionLabel}
          onConnectionStart={startConnectionCreation}
          onConnectionPreviewUpdate={updateConnectionPreview}
          onConnectionFinish={finishConnectionCreation}
          onConnectionCancel={cancelConnectionCreation}
          setDraggedNode={setDraggedNode}
          setSelectedNode={setSelectedNode}
          onNavigateToNode={handleNavigateToNode}
        />
      </div>

      <NodeForm
        isVisible={showNodeForm}
        editingNode={editingNode}
        formData={nodeForm}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onCancel={resetForm}
      />

      <DeleteNodeDialog
        isOpen={deleteDialogState.isOpen}
        nodeName={deleteDialogState.nodeName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default StorylinePanel;
