
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, Sparkles, Check } from 'lucide-react';
import ChronologicalTimeline from './ChronologicalTimeline';
import AnalysisStatusIndicator from './AnalysisStatusIndicator';

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

interface WritingSpaceHeaderProps {
  project: Project;
  currentChapter: Chapter | null;
  chapters: Chapter[];
  isSaving: boolean;
  lastSaved: Date | null;
  onBackClick: () => void;
  onSave: () => void;
}

const WritingSpaceHeader = ({
  project,
  currentChapter,
  chapters,
  isSaving,
  lastSaved,
  onBackClick,
  onSave
}: WritingSpaceHeaderProps) => {
  const navigate = useNavigate();
  
  const handleRefinementSpace = () => {
    navigate(`/project/${project.id}/refine${currentChapter ? `/${currentChapter.id}` : ''}`);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={onBackClick}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="h-6 w-px bg-slate-300" />
          
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{project.title}</h1>
            {currentChapter && (
              <p className="text-sm text-slate-600">
                {currentChapter.title} • {chapters.length} chapters
              </p>
            )}
          </div>
        </div>

        {/* Centered Timeline Component */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ChronologicalTimeline projectId={project.id} />
        </div>

        <div className="flex items-center space-x-4">
          {/* Analysis Status Indicator positioned between timeline and action buttons */}
          <AnalysisStatusIndicator projectId={project.id} />
          
          <div className="h-6 w-px bg-slate-200" />
          
          <Button
            variant="outline"
            onClick={handleRefinementSpace}
            className="flex items-center space-x-2 text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter Refinement Space</span>
          </Button>
          
          <div className="h-6 w-px bg-slate-200" />
          
          <div className="flex items-center space-x-3">
            {/* Simple animated save status icon */}
            <div className="flex items-center">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : lastSaved ? (
                <Check className="w-4 h-4 text-green-500 animate-pulse" />
              ) : null}
            </div>
            
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingSpaceHeader;
