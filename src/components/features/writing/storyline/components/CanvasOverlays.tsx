
import React from 'react';
import ConnectionLabelForm from '../ConnectionLabelForm';
import { StorylineConnection, ConnectionLabelState } from '../types';

interface CanvasOverlaysProps {
  connectionLabelState: ConnectionLabelState;
  connectionCreationState: {
    isCreating: boolean;
  };
  connections: StorylineConnection[];
  onConnectionLabelSave: (connectionId: string, label: string) => void;
  onConnectionLabelCancel: () => void;
}

const CanvasOverlays = React.memo(({
  connectionLabelState,
  connectionCreationState,
  connections,
  onConnectionLabelSave,
  onConnectionLabelCancel
}: CanvasOverlaysProps) => {
  return (
    <>
      {/* Connection Label Form */}
      {connectionLabelState.isEditing && connectionLabelState.connectionId && connectionLabelState.position && (
        <ConnectionLabelForm
          connectionId={connectionLabelState.connectionId}
          currentLabel={connections.find(c => c.id === connectionLabelState.connectionId)?.label || ''}
          position={connectionLabelState.position}
          onSave={onConnectionLabelSave}
          onCancel={onConnectionLabelCancel}
        />
      )}

      {/* Connection Creation Instructions */}
      {connectionCreationState.isCreating && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 z-20">
          <p className="text-sm text-blue-800 font-medium">Creating Connection</p>
          <p className="text-xs text-blue-600">Click on a target node or connection circle to connect, or click elsewhere to cancel</p>
        </div>
      )}
    </>
  );
});

CanvasOverlays.displayName = 'CanvasOverlays';

export default CanvasOverlays;
