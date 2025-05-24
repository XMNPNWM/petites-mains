
import React from 'react';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface WritingSpaceHeaderProps {
  project: Project;
  currentChapter: Chapter | null;
  onBackClick: () => void;
  onSave: () => void;
}

const WritingSpaceHeader = ({ project, currentChapter, onBackClick, onSave }: WritingSpaceHeaderProps) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBackClick}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
            {currentChapter && (
              <p className="text-sm text-slate-600">{currentChapter.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={onSave} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WritingSpaceHeader;
