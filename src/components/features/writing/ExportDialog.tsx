
import React, { useState } from 'react';
import { Download, FileText, FileImage, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { exportSingleChapter, exportMultipleChapters, ExportOptions, ChapterData } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterData[];
  currentChapter?: ChapterData | null;
  projectTitle: string;
}

const ExportDialog = ({ isOpen, onClose, chapters, currentChapter, projectTitle }: ExportDialogProps) => {
  const [exportType, setExportType] = useState<'current' | 'all'>('current');
  const [format, setFormat] = useState<'pdf' | 'docx' | 'txt'>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const options: ExportOptions = {
        format,
        includeMetadata,
        projectTitle,
      };

      if (exportType === 'current' && currentChapter) {
        await exportSingleChapter(currentChapter, options);
        toast({
          title: "Export successful",
          description: `Chapter "${currentChapter.title}" exported as ${format.toUpperCase()}`,
        });
      } else if (exportType === 'all') {
        await exportMultipleChapters(chapters, { ...options, projectTitle });
        toast({
          title: "Export successful",
          description: `All chapters exported as ${format.toUpperCase()}`,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcons = {
    pdf: FileImage,
    docx: File,
    txt: FileText,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Chapters</DialogTitle>
          <DialogDescription>
            Choose your export options and format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What to export</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as 'current' | 'all')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="current" disabled={!currentChapter} />
                <Label htmlFor="current" className={!currentChapter ? 'text-gray-400' : ''}>
                  Current chapter {currentChapter ? `(${currentChapter.title})` : '(none selected)'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All chapters ({chapters.length} chapters)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'docx' | 'txt')}>
              {(['pdf', 'docx', 'txt'] as const).map((formatOption) => {
                const Icon = formatIcons[formatOption];
                return (
                  <div key={formatOption} className="flex items-center space-x-2">
                    <RadioGroupItem value={formatOption} id={formatOption} />
                    <Label htmlFor={formatOption} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{formatOption.toUpperCase()}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="metadata" 
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
              <Label htmlFor="metadata">Include metadata (word count, status, etc.)</Label>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (exportType === 'current' && !currentChapter)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
