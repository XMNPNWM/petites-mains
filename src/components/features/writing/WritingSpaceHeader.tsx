
import React from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportDialog from './ExportDialog';
import ChronologicalTimeline from './ChronologicalTimeline';

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
  chapters: Chapter[];
  isSaving: boolean;
  lastSaved: Date | null;
  onBackClick: () => void;
  onSave: () => void;
}

const formatLastSaved = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const WritingSpaceHeader = ({ 
  project, 
  currentChapter,
  chapters,
  isSaving, 
  lastSaved, 
  onBackClick, 
  onSave 
}: WritingSpaceHeaderProps) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBackClick}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
            <div className="flex items-center space-x-3">
              {currentChapter && (
                <p className="text-sm text-slate-600">{currentChapter.title}</p>
              )}
              {lastSaved && (
                <>
                  <span className="text-slate-300">•</span>
                  <p className="text-xs text-slate-500">
                    Last saved {formatLastSaved(lastSaved)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Chronological Timeline in the center */}
        <ChronologicalTimeline projectId={project.id} />
        
        <div className="flex items-center space-x-2">
          <ExportDialog 
            project={project} 
            chapters={chapters}
            currentChapter={currentChapter}
          />
          <Button 
            onClick={onSave} 
            size="sm" 
            className="bg-gradient-to-r from-purple-600 to-blue-600"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WritingSpaceHeader;
