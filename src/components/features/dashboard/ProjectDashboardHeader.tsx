
import React from 'react';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InlineEditableText from '@/components/ui/inline-editable-text';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_active_chapter_id?: string;
}

interface ProjectDashboardHeaderProps {
  project: Project;
  onNavigateBack: () => void;
  onUpdateDescription: (newDescription: string) => Promise<void>;
  onWriteButtonClick: () => void;
  getWriteButtonText: () => string;
}

const ProjectDashboardHeader = ({
  project,
  onNavigateBack,
  onUpdateDescription,
  onWriteButtonClick,
  getWriteButtonText
}: ProjectDashboardHeaderProps) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onNavigateBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <InlineEditableText
                value={project.description}
                onSave={onUpdateDescription}
                placeholder="Add a project description..."
                maxLength={200}
              />
            </div>
          </div>
          <div>
            <Button 
              onClick={onWriteButtonClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {getWriteButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardHeader;
