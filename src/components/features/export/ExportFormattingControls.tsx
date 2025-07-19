import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';
import { LayoutOptions } from '@/stores/useExportStore';

interface ExportFormattingControlsProps {
  layoutOptions: LayoutOptions;
  onLayoutChange: (options: Partial<LayoutOptions>) => void;
  onReassemble: () => void;
  isAssembling?: boolean;
}

const ExportFormattingControls = ({
  layoutOptions,
  onLayoutChange,
  onReassemble,
  isAssembling = false
}: ExportFormattingControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Formatting Options</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onReassemble}
            disabled={isAssembling}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAssembling ? 'animate-spin' : ''}`} />
            Update Preview
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Typography */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Typography</h4>
          
          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-sm">Font Family</Label>
            <Select
              value={layoutOptions.fontFamily}
              onValueChange={(value) => onLayoutChange({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">Serif (Times New Roman)</SelectItem>
                <SelectItem value="sans-serif">Sans Serif (Arial)</SelectItem>
                <SelectItem value="monospace">Monospace (Courier)</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
                <SelectItem value="garamond">Garamond</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Font Size: {layoutOptions.fontSize}pt</Label>
            <Slider
              value={[layoutOptions.fontSize]}
              onValueChange={(value) => onLayoutChange({ fontSize: value[0] })}
              min={8}
              max={18}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Line Height: {layoutOptions.lineHeight}</Label>
            <Slider
              value={[layoutOptions.lineHeight]}
              onValueChange={(value) => onLayoutChange({ lineHeight: value[0] })}
              min={1.0}
              max={2.5}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <Separator />

        {/* Layout Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Layout</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">Chapter Separator</Label>
            <Select
              value={layoutOptions.chapterSeparator}
              onValueChange={(value: 'page-break' | 'section-break' | 'space') => 
                onLayoutChange({ chapterSeparator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page-break">Page Break</SelectItem>
                <SelectItem value="section-break">Section Break</SelectItem>
                <SelectItem value="space">Extra Space</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Top Margin: {layoutOptions.margins.top}pt</Label>
              <Slider
                value={[layoutOptions.margins.top]}
                onValueChange={(value) => onLayoutChange({ 
                  margins: { ...layoutOptions.margins, top: value[0] }
                })}
                min={36}
                max={144}
                step={12}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Bottom Margin: {layoutOptions.margins.bottom}pt</Label>
              <Slider
                value={[layoutOptions.margins.bottom]}
                onValueChange={(value) => onLayoutChange({ 
                  margins: { ...layoutOptions.margins, bottom: value[0] }
                })}
                min={36}
                max={144}
                step={12}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Left Margin: {layoutOptions.margins.left}pt</Label>
              <Slider
                value={[layoutOptions.margins.left]}
                onValueChange={(value) => onLayoutChange({ 
                  margins: { ...layoutOptions.margins, left: value[0] }
                })}
                min={36}
                max={144}
                step={12}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Right Margin: {layoutOptions.margins.right}pt</Label>
              <Slider
                value={[layoutOptions.margins.right]}
                onValueChange={(value) => onLayoutChange({ 
                  margins: { ...layoutOptions.margins, right: value[0] }
                })}
                min={36}
                max={144}
                step={12}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Document Structure */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Document Structure</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-title-page" className="text-sm">Include Title Page</Label>
            <Switch
              id="include-title-page"
              checked={layoutOptions.includeTitlePage}
              onCheckedChange={(checked) => onLayoutChange({ includeTitlePage: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-toc" className="text-sm">Include Table of Contents</Label>
            <Switch
              id="include-toc"
              checked={layoutOptions.includeTOC}
              onCheckedChange={(checked) => onLayoutChange({ includeTOC: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="header-footer" className="text-sm">Include Headers & Footers</Label>
            <Switch
              id="header-footer"
              checked={layoutOptions.headerFooter}
              onCheckedChange={(checked) => onLayoutChange({ headerFooter: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportFormattingControls;