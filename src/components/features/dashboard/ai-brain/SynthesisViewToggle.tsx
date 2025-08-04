import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SynthesisViewToggleProps {
  isSynthesizedView: boolean;
  onToggle: (value: boolean) => void;
  synthesizedCount?: number;
  granularCount?: number;
}

export const SynthesisViewToggle: React.FC<SynthesisViewToggleProps> = ({
  isSynthesizedView,
  onToggle,
  synthesizedCount = 0,
  granularCount = 0
}) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="synthesis-mode"
              checked={isSynthesizedView}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-purple-600"
            />
            <Label htmlFor="synthesis-mode" className="flex items-center space-x-2 cursor-pointer">
              {isSynthesizedView ? (
                <>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Synthesized View</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Granular View</span>
                </>
              )}
            </Label>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  {isSynthesizedView 
                    ? "View AI-synthesized entities that combine information from multiple chapters"
                    : "View individual records extracted from specific chapters"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center space-x-4 text-sm text-slate-600">
          <div className="flex items-center space-x-1">
            <span className="font-medium">
              {isSynthesizedView ? synthesizedCount : granularCount}
            </span>
            <span>
              {isSynthesizedView ? 'synthesized' : 'granular'} entities
            </span>
          </div>
        </div>
      </div>

      {isSynthesizedView && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-slate-600 flex items-center space-x-2">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>
              AI-synthesized entities combine and consolidate information from multiple chapters for a comprehensive view
            </span>
          </p>
        </div>
      )}
    </Card>
  );
};