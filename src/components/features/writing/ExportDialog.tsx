
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileDown, FileText, File } from 'lucide-react';
import { exportToPDF, exportToDocx, exportToTxt, downloadFile } from '@/lib/exportUtils';

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
  description?: string;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  chapters: Chapter[];
}

const ExportDialog = ({ open, onOpenChange, project, chapters }: ExportDialogProps) => {
  const [format, setFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      
      switch (format) {
        case 'pdf':
          const pdf = await exportToPDF(project, chapters);
          pdf.save(`${filename}.pdf`);
          break;
        case 'docx':
          const docxBlob = await exportToDocx(project, chapters);
          downloadFile(docxBlob, `${filename}.docx`);
          break;
        case 'txt':
          const txtContent = exportToTxt(project, chapters);
          downloadFile(txtContent, `${filename}.txt`);
          break;
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-2">
              Export "{project.title}" with {chapters.length} chapters
            </p>
            <p className="text-xs text-slate-500">
              Total words: {chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0).toLocaleString()}
            </p>
          </div>
          <RadioGroup value={format} onValueChange={setFormat} className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="pdf" id="pdf" />
              <FileDown className="w-4 h-4 text-red-600" />
              <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                <div className="font-medium">PDF Document</div>
                <div className="text-xs text-slate-500">Formatted document with chapters</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="docx" id="docx" />
              <FileText className="w-4 h-4 text-blue-600" />
              <Label htmlFor="docx" className="flex-1 cursor-pointer">
                <div className="font-medium">Word Document</div>
                <div className="text-xs text-slate-500">Editable Microsoft Word format</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="txt" id="txt" />
              <File className="w-4 h-4 text-slate-600" />
              <Label htmlFor="txt" className="flex-1 cursor-pointer">
                <div className="font-medium">Plain Text</div>
                <div className="text-xs text-slate-500">Simple text file format</div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
