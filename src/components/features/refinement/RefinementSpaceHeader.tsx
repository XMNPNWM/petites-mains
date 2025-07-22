
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Download, Save, Loader2, Check } from 'lucide-react';
import ChronologicalTimeline from '../writing/ChronologicalTimeline';

import ExportDialog from '../writing/ExportDialog';
import { useProjectData } from '@/hooks/useProjectData';
import { Project, Chapter } from '@/types/shared';

interface RefinementSpaceHeaderProps {
  project?: Project;
  currentChapter?: Chapter | null;
  onBackClick: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

const RefinementSpaceHeader = ({ 
  project, 
  currentChapter, 
  onBackClick,
  onSave,
  isSaving = false,
  lastSaved
}: RefinementSpaceHeaderProps) => {
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const { chapters } = useProjectData(project?.id || '');

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Creation</span>
          </Button>
          
          <div className="h-6 w-px bg-slate-300" />
          
          <div className="flex items-center space-x-2 text-purple-600">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Refinement Space</span>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Project Info Display */}
          {project && (
            <div className="flex items-center space-x-2">
              <div className="text-sm">
                <span className="font-medium text-slate-900">{project.title}</span>
                {chapters.length > 0 && (
                  <span className="text-slate-600 ml-2">• {chapters.length} chapters</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Centered Timeline Component */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {project && <ChronologicalTimeline projectId={project.id} />}
        </div>

        <div className="flex items-center space-x-3">


          {/* Save functionality */}
          {onSave && (
            <>
              <div className="flex items-center space-x-2">
                {/* Save status indicator */}
                <div className="flex items-center">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : lastSaved ? (
                    <Check className="w-4 h-4 text-green-500 animate-pulse" />
                  ) : null}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </Button>
              </div>
              
              <div className="h-6 w-px bg-slate-200" />
            </>
          )}
          
          {project && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </div>

      {showExportDialog && project && (
        <ExportDialog
          project={project}
          chapters={chapters}
          currentChapter={currentChapter}
          onClose={() => setShowExportDialog(false)}
          isRefinementSpace={true}
        />
      )}
    </div>
  );
};

export default RefinementSpaceHeader;
