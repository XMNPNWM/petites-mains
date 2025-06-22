
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, Loader2, X } from 'lucide-react';
import { exportToPDF, exportToDOCX, exportToTXT } from '@/lib/exportUtils';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface Project {
  id: string;
  title: string;
}

interface ExportDialogProps {
  project: Project;
  chapters: Chapter[];
  currentChapter?: Chapter | null;
}

const ExportDialog = ({ project, chapters, currentChapter }: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportScope, setExportScope] = useState('all');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const chaptersToExport = exportScope === 'current' && currentChapter 
        ? [currentChapter] 
        : chapters.sort((a, b) => a.order_index - b.order_index);

      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(project, chaptersToExport, includeMetadata);
          break;
        case 'docx':
          await exportToDOCX(project, chaptersToExport, includeMetadata);
          break;
        case 'txt':
          exportToTXT(project, chaptersToExport, includeMetadata);
          break;
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Export Project</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div>
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Document</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label htmlFor="docx">Word Document (.docx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt">Plain Text (.txt)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Scope */}
          <div>
            <Label className="text-sm font-medium">Export Scope</Label>
            <RadioGroup value={exportScope} onValueChange={setExportScope} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Chapters ({chapters.length})</Label>
              </div>
              {currentChapter && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="current" id="current" />
                  <Label htmlFor="current">Current Chapter ({currentChapter.title})</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="metadata" 
              checked={includeMetadata}
              onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
            />
            <Label htmlFor="metadata" className="text-sm">
              Include metadata (word counts, chapter info)
            </Label>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
