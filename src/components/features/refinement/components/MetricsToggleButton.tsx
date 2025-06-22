
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface MetricsToggleButtonProps {
  onToggle: () => void;
}

const MetricsToggleButton = ({ onToggle }: MetricsToggleButtonProps) => {
  return (
    <div className="flex items-center justify-center w-6 bg-slate-50 border-l border-slate-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="p-1 h-auto rotate-180"
        title="Show Metrics"
      >
        <ChevronRight className="w-3 h-3 text-slate-500" />
      </Button>
    </div>
  );
};

export default MetricsToggleButton;
