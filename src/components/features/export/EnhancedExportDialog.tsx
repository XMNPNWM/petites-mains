
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  X, 
  FileText, 
  ChevronRight,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useExportStore } from '@/stores/useExportStore';
import { Chapter, Project } from '@/types/shared';
import ExportChapterCard from './ExportChapterCard';

interface EnhancedExportDialogProps {
  project: Project;
  chapters: Chapter[];
  currentChapter?: Chapter | null;
  onClose?: () => void;
  isRefinementSpace?: boolean;
}

interface ChapterWithEnhancement extends Chapter {
  hasEnhancedContent: boolean;
}

const EnhancedExportDialog = ({ 
  project, 
  chapters, 
  currentChapter, 
  onClose,
  isRefinementSpace = false 
}: EnhancedExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chaptersWithEnhancements, setChaptersWithEnhancements] = useState<ChapterWithEnhancement[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    selectedChapters,
    exportFormat,
    includeMetadata,
    templateId,
    toggleChapterSelection,
    setContentSource,
    reorderChapters,
    setExportFormat,
    setIncludeMetadata,
    setTemplateId,
    selectAllChapters,
    selectByStatus,
    clearSelection,
    reset
  } = useExportStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check for enhanced content availability
  useEffect(() => {
    const checkEnhancedContent = async () => {
      if (!isRefinementSpace) {
        setChaptersWithEnhancements(chapters.map(c => ({ ...c, hasEnhancedContent: false })));
        return;
      }

      try {
        const chapterIds = chapters.map(c => c.id);
        const { data: refinements } = await supabase
          .from('chapter_refinements')
          .select('chapter_id, enhanced_content')
          .in('chapter_id', chapterIds);

        const enhancementMap = new Map(
          refinements?.map(r => [r.chapter_id, !!r.enhanced_content]) || []
        );

        const chaptersWithEnhanced = chapters.map(chapter => ({
          ...chapter,
          hasEnhancedContent: enhancementMap.get(chapter.id) || false
        }));

        setChaptersWithEnhancements(chaptersWithEnhanced);
      } catch (error) {
        console.error('Error checking enhanced content:', error);
        setChaptersWithEnhancements(chapters.map(c => ({ ...c, hasEnhancedContent: false })));
      }
    };

    checkEnhancedContent();
  }, [chapters, isRefinementSpace]);

  const handleClose = () => {
    setIsOpen(false);
    reset();
    if (onClose) onClose();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeIndex = selectedChapters.findIndex(c => c.chapterId === active.id);
      const overIndex = selectedChapters.findIndex(c => c.chapterId === over?.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const reorderedItems = arrayMove(selectedChapters, activeIndex, overIndex);
        reorderChapters(reorderedItems);
      }
    }
  };

  const handleContinueToExportSpace = () => {
    if (selectedChapters.length === 0) {
      toast({
        title: "No chapters selected",
        description: "Please select at least one chapter to export.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to export space with selected chapters
    const searchParams = new URLSearchParams({
      chapters: JSON.stringify(selectedChapters),
      format: exportFormat,
      template: templateId,
      metadata: includeMetadata.toString()
    });

    navigate(`/project/${project.id}/export?${searchParams.toString()}`);
    handleClose();
  };

  const getSelectedChaptersCount = () => selectedChapters.length;
  const getTotalWordsCount = () => {
    return selectedChapters.reduce((total, selection) => {
      const chapter = chaptersWithEnhancements.find(c => c.id === selection.chapterId);
      return total + (chapter?.word_count || 0);
    }, 0);
  };

  const sortedChapters = [...chaptersWithEnhancements].sort((a, b) => a.order_index - b.order_index);
  const selectedChapterIds = selectedChapters.map(s => s.chapterId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Export Project: {project.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Panel - Chapter Selection */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Batch Selection Controls */}
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Chapter Selection</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllChapters(chaptersWithEnhancements)}
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectByStatus(chaptersWithEnhancements, 'published')}
                  >
                    Published Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Selection Summary */}
              {selectedChapters.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-800">
                      {getSelectedChaptersCount()} chapters selected
                    </span>
                    <span className="text-blue-600">
                      {getTotalWordsCount().toLocaleString()} total words
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chapter List */}
            <ScrollArea className="flex-1 pr-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedChapterIds}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedChapters.map((chapter) => {
                    const selection = selectedChapters.find(s => s.chapterId === chapter.id);
                    const isSelected = !!selection;
                    const order = selectedChapters.findIndex(s => s.chapterId === chapter.id);

                    return (
                      <ExportChapterCard
                        key={chapter.id}
                        chapter={chapter}
                        selection={selection}
                        isSelected={isSelected}
                        order={order}
                        onToggleSelection={() => toggleChapterSelection(chapter.id, chapter)}
                        onContentSourceChange={(source) => setContentSource(chapter.id, source)}
                        hasEnhancedContent={chapter.hasEnhancedContent}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </div>

          {/* Right Panel - Export Settings */}
          <div className="w-80 space-y-6">
            {/* Export Format */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Export Format</Label>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf">PDF Document</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="docx" id="docx" />
                  <Label htmlFor="docx">Word Document (.docx)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="epub" id="epub" />
                  <Label htmlFor="epub">E-Book (.epub)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="txt" id="txt" />
                  <Label htmlFor="txt">Plain Text (.txt)</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Template Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Document Template</Label>
              <RadioGroup value={templateId} onValueChange={setTemplateId}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default">Default</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fiction" id="fiction" />
                  <Label htmlFor="fiction">Fiction Novel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="academic" id="academic" />
                  <Label htmlFor="academic">Academic Paper</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label htmlFor="metadata" className="text-sm">
                  Include metadata (word counts, chapter info)
                </Label>
              </div>
            </div>

            <Separator />

            {/* Continue Button */}
            <Button 
              onClick={handleContinueToExportSpace}
              disabled={selectedChapters.length === 0 || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <FileText className="w-4 h-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Export Space
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExportDialog;
