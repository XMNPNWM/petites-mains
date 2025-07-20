
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TOCOptions } from '@/stores/useExportStore';

interface TOCControlsProps {
  options: TOCOptions;
  onOptionsChange: (options: Partial<TOCOptions>) => void;
}

const TOCControls = ({ options, onOptionsChange }: TOCControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Table of Contents</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* TOC Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">TOC Title</Label>
          <Input
            value={options.customTitle}
            onChange={(e) => onOptionsChange({ customTitle: e.target.value })}
            placeholder="Table of Contents"
          />
        </div>

        <Separator />

        {/* TOC Formatting */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">TOC Formatting</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">Font Size: {options.tocFontSize}pt</Label>
            <Slider
              value={[options.tocFontSize]}
              onValueChange={(value) => onOptionsChange({ tocFontSize: value[0] })}
              min={8}
              max={18}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">TOC Depth (Heading Levels)</Label>
            <Select
              value={options.tocDepth.toString()}
              onValueChange={(value) => onOptionsChange({ tocDepth: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Chapters Only</SelectItem>
                <SelectItem value="2">Chapters + Sections</SelectItem>
                <SelectItem value="3">Chapters + Sections + Subsections</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Page Numbers */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Page Numbers</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-page-numbers" className="text-sm">Include Page Numbers</Label>
            <Switch
              id="include-page-numbers"
              checked={options.includePageNumbers}
              onCheckedChange={(checked) => onOptionsChange({ includePageNumbers: checked })}
            />
          </div>

          {options.includePageNumbers && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Page Number Alignment</Label>
                <Select
                  value={options.pageNumberAlignment}
                  onValueChange={(value: 'left' | 'right') => 
                    onOptionsChange({ pageNumberAlignment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="dot-leaders" className="text-sm">Dot Leaders (...)</Label>
                <Switch
                  id="dot-leaders"
                  checked={options.dotLeaders}
                  onCheckedChange={(checked) => onOptionsChange({ dotLeaders: checked })}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Additional Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Additional Options</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-chapter-numbers" className="text-sm">Include Chapter Numbers</Label>
            <Switch
              id="include-chapter-numbers"
              checked={options.includeChapterNumbers}
              onCheckedChange={(checked) => onOptionsChange({ includeChapterNumbers: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TOCControls;
