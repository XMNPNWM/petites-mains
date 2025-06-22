
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Download } from 'lucide-react';
import ChronologicalTimeline from '../writing/ChronologicalTimeline';
import ExportDialog from '../writing/ExportDialog';
import { useProjectData } from '@/hooks/useProjectData';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  user_id: string;
}

interface RefinementSpaceHeaderProps {
  project: Project;
  currentChapter: Chapter | null;
  onBackClick: () => void;
}

const RefinementSpaceHeader = ({ 
  project, 
  currentChapter, 
  onBackClick 
}: RefinementSpaceHeaderProps) => {
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const { chapters } = useProjectData(project.id);

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
        </div>

        {/* Timeline Component */}
        <ChronologicalTimeline projectId={project.id} />

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog
          project={project}
          chapters={chapters}
          currentChapter={currentChapter}
        />
      )}
    </div>
  );
};

export default RefinementSpaceHeader;
