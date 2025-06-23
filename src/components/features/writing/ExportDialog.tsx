
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, Loader2, X } from 'lucide-react';
import { exportToPDF, exportToDOCX, exportToTXT } from '@/lib/exportUtils';
import { supabase } from '@/integrations/supabase/client';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface ChapterRefinement {
  id: string;
  chapter_id: string;
  enhanced_content: string;
}

interface Project {
  id: string;
  title: string;
}

interface ExportDialogProps {
  project: Project;
  chapters: Chapter[];
  currentChapter?: Chapter | null;
  onClose?: () => void;
  isRefinementSpace?: boolean;
}

const ExportDialog = ({ 
  project, 
  chapters, 
  currentChapter, 
  onClose,
  isRefinementSpace = false 
}: ExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportScope, setExportScope] = useState('all');
  const [contentSource, setContentSource] = useState('original');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const fetchEnhancedContent = async (chapterIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('chapter_refinements')
        .select('chapter_id, enhanced_content')
        .in('chapter_id', chapterIds);

      if (error) throw error;

      const enhancedContentMap = new Map();
      data?.forEach((item: ChapterRefinement) => {
        enhancedContentMap.set(item.chapter_id, item.enhanced_content);
      });

      return enhancedContentMap;
    } catch (error) {
      console.error('Error fetching enhanced content:', error);
      return new Map();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const chaptersToExport = exportScope === 'current' && currentChapter 
        ? [currentChapter] 
        : chapters.sort((a, b) => a.order_index - b.order_index);

      let finalChapters = [...chaptersToExport];

      // If in refinement space and user wants enhanced content
      if (isRefinementSpace && contentSource === 'enhanced') {
        const chapterIds = chaptersToExport.map(ch => ch.id);
        const enhancedContentMap = await fetchEnhancedContent(chapterIds);
        
        finalChapters = chaptersToExport.map(chapter => ({
          ...chapter,
          content: enhancedContentMap.get(chapter.id) || chapter.content
        }));
      }

      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(project, finalChapters, includeMetadata);
          break;
        case 'docx':
          await exportToDOCX(project, finalChapters, includeMetadata);
          break;
        case 'txt':
          exportToTXT(project, finalChapters, includeMetadata);
          break;
      }
      
      handleClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Export Project</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
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

          {/* Content Source - Only show in refinement space */}
          {isRefinementSpace && (
            <div>
              <Label className="text-sm font-medium">Content Source</Label>
              <RadioGroup value={contentSource} onValueChange={setContentSource} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="original" id="original" />
                  <Label htmlFor="original">Original Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enhanced" id="enhanced" />
                  <Label htmlFor="enhanced">Enhanced Content</Label>
                </div>
              </RadioGroup>
            </div>
          )}

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
          <div className="flex justify-end">
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
