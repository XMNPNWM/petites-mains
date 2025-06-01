
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeToggleProps {
  areMinimized: boolean;
  onToggle: () => void;
}

const FocusModeToggle = ({ areMinimized, onToggle }: FocusModeToggleProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="h-8 w-8 hover:bg-slate-100 transition-colors"
      title={areMinimized ? "Restore Panels" : "Minimize Panels"}
    >
      {areMinimized ? (
        <Maximize2 className="h-4 w-4 text-slate-600" />
      ) : (
        <Minimize2 className="h-4 w-4 text-slate-600" />
      )}
    </Button>
  );
};

export default FocusModeToggle;
