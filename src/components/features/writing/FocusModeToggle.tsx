
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
      className="h-8 w-8 hover:bg-slate-100 transition-colors"
      title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
    >
      {isFocusMode ? (
        <Minimize2 className="h-4 w-4 text-slate-600" />
      ) : (
        <Maximize2 className="h-4 w-4 text-slate-600" />
      )}
    </Button>
  );
};

export default FocusModeToggle;
