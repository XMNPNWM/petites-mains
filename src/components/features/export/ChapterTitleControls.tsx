
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ChapterTitleOptions } from '@/stores/useExportStore';

interface ChapterTitleControlsProps {
  options: ChapterTitleOptions;
  onOptionsChange: (options: Partial<ChapterTitleOptions>) => void;
}

const ChapterTitleControls = ({ options, onOptionsChange }: ChapterTitleControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chapter Title Formatting</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chapter Numbering */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Chapter Numbering</Label>
          <Select
            value={options.numberingStyle}
            onValueChange={(value: 'none' | 'arabic' | 'roman' | 'words') => 
              onOptionsChange({ numberingStyle: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Numbers</SelectItem>
              <SelectItem value="arabic">Arabic (1, 2, 3)</SelectItem>
              <SelectItem value="roman">Roman (I, II, III)</SelectItem>
              <SelectItem value="words">Words (One, Two, Three)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chapter Prefix */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Chapter Prefix</Label>
          <Select
            value={options.prefix}
            onValueChange={(value: 'chapter' | 'part' | 'section' | 'custom' | 'none') => 
              onOptionsChange({ prefix: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Prefix</SelectItem>
              <SelectItem value="chapter">Chapter</SelectItem>
              <SelectItem value="part">Part</SelectItem>
              <SelectItem value="section">Section</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {options.prefix === 'custom' && (
            <Input
              placeholder="Enter custom prefix"
              value={options.customPrefix}
              onChange={(e) => onOptionsChange({ customPrefix: e.target.value })}
              className="mt-2"
            />
          )}
        </div>

        <Separator />

        {/* Typography */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Typography</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">Font Family</Label>
            <Select
              value={options.fontFamily}
              onValueChange={(value) => onOptionsChange({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">Serif (Times New Roman)</SelectItem>
                <SelectItem value="sans-serif">Sans Serif (Arial)</SelectItem>
                <SelectItem value="'Playfair Display', serif">Playfair Display</SelectItem>
                <SelectItem value="'Lora', serif">Lora</SelectItem>
                <SelectItem value="'Merriweather', serif">Merriweather</SelectItem>
                <SelectItem value="'Crimson Text', serif">Crimson Text</SelectItem>
                <SelectItem value="'EB Garamond', serif">EB Garamond</SelectItem>
                <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                <SelectItem value="'Source Sans Pro', sans-serif">Source Sans Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Font Size: {options.fontSize}pt</Label>
            <Slider
              value={[options.fontSize]}
              onValueChange={(value) => onOptionsChange({ fontSize: value[0] })}
              min={12}
              max={36}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Font Weight</Label>
            <Select
              value={options.fontWeight}
              onValueChange={(value: 'normal' | 'medium' | 'semibold' | 'bold') => 
                onOptionsChange({ fontWeight: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="semibold">Semi Bold</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Alignment</Label>
            <Select
              value={options.alignment}
              onValueChange={(value: 'left' | 'center' | 'right') => 
                onOptionsChange({ alignment: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Decorative Elements */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Decorative Elements</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-underline" className="text-sm">Include Underline</Label>
            <Switch
              id="include-underline"
              checked={options.includeUnderline}
              onCheckedChange={(checked) => onOptionsChange({ includeUnderline: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-separator" className="text-sm">Include Separator</Label>
            <Switch
              id="include-separator"
              checked={options.includeSeparator}
              onCheckedChange={(checked) => onOptionsChange({ includeSeparator: checked })}
            />
          </div>

          {options.includeSeparator && (
            <div className="space-y-2">
              <Label className="text-sm">Separator Style</Label>
              <Select
                value={options.separatorStyle}
                onValueChange={(value: 'line' | 'ornament' | 'dots') => 
                  onOptionsChange({ separatorStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="ornament">Ornament</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChapterTitleControls;
