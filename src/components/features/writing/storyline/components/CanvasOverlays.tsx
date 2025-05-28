
import React from 'react';
import ConnectionLabelForm from '../ConnectionLabelForm';
import { ConnectionLabelState, StorylineConnection } from '../types';

interface ConnectionCreationState {
  isCreating: boolean;
  sourceNodeId: string | null;
  previewConnection: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
}

interface CanvasOverlaysProps {
  connectionLabelState: ConnectionLabelState;
  connectionCreationState: ConnectionCreationState;
  connections: StorylineConnection[];
  onConnectionLabelSave: (connectionId: string, label: string) => void;
  onConnectionLabelDelete: (connectionId: string) => void;
  onConnectionLabelCancel: () => void;
}

const CanvasOverlays = React.memo(({
  connectionLabelState,
  connections,
  onConnectionLabelSave,
  onConnectionLabelDelete,
  onConnectionLabelCancel
}: CanvasOverlaysProps) => {
  return (
    <>
      {/* Connection Label Form */}
      {connectionLabelState.isEditing && connectionLabelState.connectionId && connectionLabelState.position && (
        <ConnectionLabelForm
          connectionId={connectionLabelState.connectionId}
          currentLabel={
            connections.find(c => c.id === connectionLabelState.connectionId)?.label || ''
          }
          position={connectionLabelState.position}
          onSave={onConnectionLabelSave}
          onDelete={onConnectionLabelDelete}
          onCancel={onConnectionLabelCancel}
        />
      )}
    </>
  );
});

CanvasOverlays.displayName = 'CanvasOverlays';

export default CanvasOverlays;
