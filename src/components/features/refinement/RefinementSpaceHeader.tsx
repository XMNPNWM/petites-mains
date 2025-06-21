
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3, Sparkles } from 'lucide-react';
import ChronologicalTimeline from '../writing/ChronologicalTimeline';

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
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-purple-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Refinement Space</span>
            </div>
            <div className="text-slate-600">
              <span className="font-medium">{project.title}</span>
              {currentChapter && (
                <>
                  <span className="mx-2">•</span>
                  <span>{currentChapter.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Component */}
        <ChronologicalTimeline projectId={project.id} />

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Edit3 className="w-4 h-4" />
            <span>Enhanced Editor Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefinementSpaceHeader;
