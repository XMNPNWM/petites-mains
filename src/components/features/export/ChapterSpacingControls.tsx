
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ChapterSpacingOptions } from '@/stores/useExportStore';

interface ChapterSpacingControlsProps {
  options: ChapterSpacingOptions;
  onOptionsChange: (options: Partial<ChapterSpacingOptions>) => void;
}

const ChapterSpacingControls = ({ options, onOptionsChange }: ChapterSpacingControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chapter Spacing</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Break Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Chapter Break Type</Label>
          <Select
            value={options.breakType}
            onValueChange={(value: 'page-break' | 'large-space' | 'medium-space' | 'small-space' | 'decorative-break') => 
              onOptionsChange({ breakType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page-break">Page Break</SelectItem>
              <SelectItem value="large-space">Large Space</SelectItem>
              <SelectItem value="medium-space">Medium Space</SelectItem>
              <SelectItem value="small-space">Small Space</SelectItem>
              <SelectItem value="decorative-break">Decorative Break</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Spacing Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Spacing Amounts (pixels)</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">Space Before Chapter: {options.spacingBefore}px</Label>
            <Slider
              value={[options.spacingBefore]}
              onValueChange={(value) => onOptionsChange({ spacingBefore: value[0] })}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Space After Chapter: {options.spacingAfter}px</Label>
            <Slider
              value={[options.spacingAfter]}
              onValueChange={(value) => onOptionsChange({ spacingAfter: value[0] })}
              min={0}
              max={200}
              step={10}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">First Chapter Spacing: {options.firstChapterSpacing}px</Label>
            <Slider
              value={[options.firstChapterSpacing]}
              onValueChange={(value) => onOptionsChange({ firstChapterSpacing: value[0] })}
              min={0}
              max={300}
              step={10}
              className="w-full"
            />
          </div>

          {(options.breakType === 'large-space' || options.breakType === 'medium-space' || options.breakType === 'small-space' || options.breakType === 'decorative-break') && (
            <div className="space-y-2">
              <Label className="text-sm">Custom Break Spacing: {options.customSpacing}px</Label>
              <Slider
                value={[options.customSpacing]}
                onValueChange={(value) => onOptionsChange({ customSpacing: value[0] })}
                min={20}
                max={300}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterSpacingControls;
