
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ContentFormattingOptions } from '@/stores/useExportStore';

interface ContentFormattingControlsProps {
  options: ContentFormattingOptions;
  onOptionsChange: (options: Partial<ContentFormattingOptions>) => void;
}

const ContentFormattingControls = ({ options, onOptionsChange }: ContentFormattingControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Content Formatting</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Text Alignment</Label>
          <Select
            value={options.textAlignment}
            onValueChange={(value: 'left' | 'justify' | 'center') => 
              onOptionsChange({ textAlignment: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left Align</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
              <SelectItem value="center">Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Paragraph Formatting */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Paragraph Formatting</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">First Line Indent: {options.paragraphIndent}em</Label>
            <Slider
              value={[options.paragraphIndent]}
              onValueChange={(value) => onOptionsChange({ paragraphIndent: value[0] })}
              min={0}
              max={3}
              step={0.25}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Paragraph Spacing: {options.paragraphSpacing}em</Label>
            <Slider
              value={[options.paragraphSpacing]}
              onValueChange={(value) => onOptionsChange({ paragraphSpacing: value[0] })}
              min={0}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Scene Break Spacing: {options.sceneBreakSpacing}em</Label>
            <Slider
              value={[options.sceneBreakSpacing]}
              onValueChange={(value) => onOptionsChange({ sceneBreakSpacing: value[0] })}
              min={1}
              max={5}
              step={0.25}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="preserve-empty-lines" className="text-sm">Preserve Empty Lines</Label>
            <Switch
              id="preserve-empty-lines"
              checked={options.preserveEmptyLines}
              onCheckedChange={(checked) => onOptionsChange({ preserveEmptyLines: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="detect-scene-breaks" className="text-sm">Auto-Detect Scene Breaks</Label>
            <Switch
              id="detect-scene-breaks"
              checked={options.detectSceneBreaks}
              onCheckedChange={(checked) => onOptionsChange({ detectSceneBreaks: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Special Effects */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Special Effects</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="drop-caps" className="text-sm">Drop Caps (First Letter)</Label>
            <Switch
              id="drop-caps"
              checked={options.enableDropCaps}
              onCheckedChange={(checked) => onOptionsChange({ enableDropCaps: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Typography Enhancements */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Typography Enhancements</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="smart-quotes" className="text-sm">Smart Quotes (" " → " ")</Label>
            <Switch
              id="smart-quotes"
              checked={options.smartQuotes}
              onCheckedChange={(checked) => onOptionsChange({ smartQuotes: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-typography" className="text-sm">Auto Typography (-- → —)</Label>
            <Switch
              id="auto-typography"
              checked={options.autoTypography}
              onCheckedChange={(checked) => onOptionsChange({ autoTypography: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="preserve-formatting" className="text-sm">Preserve Original Formatting</Label>
            <Switch
              id="preserve-formatting"
              checked={options.preserveFormatting}
              onCheckedChange={(checked) => onOptionsChange({ preserveFormatting: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentFormattingControls;
