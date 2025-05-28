
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Trash2 } from 'lucide-react';

interface ConnectionLabelFormProps {
  connectionId: string;
  currentLabel: string;
  position: { x: number; y: number };
  onSave: (connectionId: string, label: string) => void;
  onDelete: (connectionId: string) => void;
  onCancel: () => void;
}

const ConnectionLabelForm = ({
  connectionId,
  currentLabel,
  position,
  onSave,
  onDelete,
  onCancel
}: ConnectionLabelFormProps) => {
  const [label, setLabel] = useState(currentLabel);

  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel]);

  const handleSave = () => {
    onSave(connectionId, label.trim());
  };

  const handleDelete = () => {
    onDelete(connectionId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Don't show form for preview connections
  if (connectionId === 'preview-connection') {
    return null;
  }

  return (
    <div
      className="absolute z-50 bg-white border border-slate-200 rounded-md shadow-lg p-2"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center space-x-2 min-w-48">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Relationship label..."
          className="text-xs h-8"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0"
          title="Save label"
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="h-8 w-8 p-0"
          title="Delete connection"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
          title="Cancel"
        >
          <X className="w-3 h-3 text-slate-600" />
        </Button>
      </div>
    </div>
  );
};

export default ConnectionLabelForm;
