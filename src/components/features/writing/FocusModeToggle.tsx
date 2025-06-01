
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
}

const FocusModeToggle = ({ isFocusMode, onToggle }: FocusModeToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-8 w-8 text-slate-500 hover:text-slate-700"
      title={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
    >
      {isFocusMode ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
    </Button>
  );
};

export default FocusModeToggle;
