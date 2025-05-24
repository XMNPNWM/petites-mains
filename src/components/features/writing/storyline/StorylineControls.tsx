
import React from 'react';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StorylineControlsProps {
  zoom: number;
  onAddNode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const StorylineControls = ({ zoom, onAddNode, onZoomIn, onZoomOut, onResetView }: StorylineControlsProps) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
      <h3 className="font-semibold text-slate-900 text-sm">Storyline Map</h3>
      <div className="flex items-center space-x-2">
        <Button 
          size="sm" 
          onClick={onAddNode}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-xs h-7"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Node
        </Button>
        <div className="w-px h-4 bg-slate-300"></div>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomOut}
          className="h-7 w-7 p-0 text-xs"
        >
          <ZoomOut className="w-3 h-3" />
        </Button>
        <span className="text-xs text-slate-500 min-w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomIn}
          className="h-7 w-7 p-0 text-xs"
        >
          <ZoomIn className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onResetView}
          className="h-7 px-2 text-xs"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default StorylineControls;
