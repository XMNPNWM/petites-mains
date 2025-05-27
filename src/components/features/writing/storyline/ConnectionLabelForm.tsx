
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ConnectionLabelFormProps {
  connectionId: string;
  currentLabel: string;
  position: { x: number; y: number };
  onSave: (connectionId: string, label: string) => void;
  onCancel: () => void;
}

const ConnectionLabelForm = ({
  connectionId,
  currentLabel,
  position,
  onSave,
  onCancel
}: ConnectionLabelFormProps) => {
  const [label, setLabel] = useState(currentLabel);

  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel]);

  const handleSave = () => {
    onSave(connectionId, label.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

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
        >
          <Check className="w-3 h-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
};

export default ConnectionLabelForm;
