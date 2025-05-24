
import React from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProjectsStateProps {
  onCreateProject: () => void;
}

const EmptyProjectsState = ({ onCreateProject }: EmptyProjectsStateProps) => {
  return (
    <div className="text-center py-16">
      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h2>
      <p className="text-slate-600 mb-6">Create your first writing project to get started</p>
      <Button 
        onClick={onCreateProject} 
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create First Project
      </Button>
    </div>
  );
};

export default EmptyProjectsState;
