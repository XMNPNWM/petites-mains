
import React, { useState } from 'react';
import { ArrowLeft, Save, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportDialog from './ExportDialog';

interface Project {
  id: string;
  title: string;
  description?: string;
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
  isSaving: boolean;
  lastSaved: Date | null;
  chapters?: Chapter[];
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
  isSaving, 
  lastSaved,
  chapters = [],
  onBackClick, 
  onSave 
}: WritingSpaceHeaderProps) => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-6 py-4">
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
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
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

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        project={project}
        chapters={chapters}
      />
    </>
  );
};

export default WritingSpaceHeader;
