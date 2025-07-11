import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ContentType {
  key: string;
  label: string;
  description: string;
}

const contentTypes: ContentType[] = [
  { key: 'characters', label: 'Characters', description: 'Character information and traits' },
  { key: 'relationships', label: 'Character Relationships', description: 'Relationships between characters' },
  { key: 'timeline_events', label: 'Timeline Events', description: 'Story events and their chronology' },
  { key: 'plot_points', label: 'Plot Points', description: 'Key plot developments' },
  { key: 'plot_threads', label: 'Plot Threads', description: 'Ongoing storylines and arcs' },
  { key: 'world_building', label: 'World Building', description: 'Settings, locations, and world details' },
  { key: 'chapter_summaries', label: 'Chapter Summaries', description: 'Chapter summaries and key events' },
  { key: 'themes', label: 'Themes', description: 'Story themes and motifs' }
];

interface ForceReAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedTypes: string[]) => void;
  isProcessing: boolean;
}

export const ForceReAnalysisDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isProcessing
}: ForceReAnalysisDialogProps) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const handleTypeChange = (typeKey: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, typeKey]);
    } else {
      setSelectedTypes(prev => prev.filter(key => key !== typeKey));
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === contentTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(contentTypes.map(type => type.key));
    }
  };

  const handleConfirm = () => {
    if (selectedTypes.length > 0) {
      onConfirm(selectedTypes);
      setSelectedTypes([]);
    }
  };

  const handleCancel = () => {
    setSelectedTypes([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCcw className="w-5 h-5 text-orange-600" />
            <span>Force Re-Analysis</span>
          </DialogTitle>
          <DialogDescription>
            Select which content types to re-analyze. This will process all chapters again for the selected types, even if they were already analyzed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Warning</span>
            </div>
            <span className="text-xs text-amber-700">This will re-process already analyzed content</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Types</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-6 px-2"
              >
                {selectedTypes.length === contentTypes.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {contentTypes.map((type) => (
                <div key={type.key} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    id={type.key}
                    checked={selectedTypes.includes(type.key)}
                    onCheckedChange={(checked) => handleTypeChange(type.key, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={type.key}
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {type.label}
                    </label>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTypes.length === 0 || isProcessing}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isProcessing ? 'Processing...' : `Re-Analyze Selected (${selectedTypes.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};