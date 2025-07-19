import React from 'react';
import EnhancedExportDialog from '@/components/features/export/EnhancedExportDialog';

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
  return (
    <EnhancedExportDialog
      project={project}
      chapters={chapters}
      currentChapter={currentChapter}
      onClose={onClose}
      isRefinementSpace={isRefinementSpace}
    />
  );
};

export default ExportDialog;
