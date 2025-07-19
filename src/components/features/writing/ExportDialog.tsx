import React from 'react';
import EnhancedExportDialog from '@/components/features/export/EnhancedExportDialog';
import { Project, Chapter } from '@/types/shared';

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
