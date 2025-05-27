
import React, { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(currentLabel);
    // Auto-focus and select text when form appears
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [currentLabel]);

  const handleSave = () => {
    onSave(connectionId, label.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onCancel();
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave();
  };

  return (
    <div
      className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        minWidth: '200px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add relationship description..."
          className="text-sm h-8 flex-1"
          maxLength={50}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSaveClick}
          className="h-8 w-8 p-0 hover:bg-green-100"
        >
          <Check className="w-4 h-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0 hover:bg-red-100"
        >
          <X className="w-4 h-4 text-red-600" />
        </Button>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-slate-500 mt-2">
        Press Enter to save, Esc to cancel
      </p>
    </div>
  );
};

export default ConnectionLabelForm;
