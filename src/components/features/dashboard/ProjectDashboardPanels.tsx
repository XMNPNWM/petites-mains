
import React from 'react';
import { Card } from '@/components/ui/card';
import ReadOnlyStorylineViewer from './ReadOnlyStorylineViewer';
import UnifiedWorldbuildingPanel from './UnifiedWorldbuildingPanel';

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  status: string;
  order_index: number;
}

interface ProjectDashboardPanelsProps {
  currentPanel: number;
  projectId: string;
  chapters: Chapter[];
  totalWorldElements: number;
  totalCharacters: number;
  onChapterClick: (chapterId: string) => void;
}

const ProjectDashboardPanels = ({
  currentPanel,
  projectId,
  chapters,
  totalWorldElements,
  totalCharacters,
  onChapterClick
}: ProjectDashboardPanelsProps) => {
  const renderStorylinePanel = () => (
    <div className="h-full">
      <ReadOnlyStorylineViewer 
        projectId={projectId}
      />
    </div>
  );

  const renderWorldbuildingPanel = () => (
    <div className="h-full overflow-y-auto">
      <UnifiedWorldbuildingPanel projectId={projectId} />
    </div>
  );

  const renderChaptersPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Chapters</h3>
      {chapters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">No chapters created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Card 
              key={chapter.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onChapterClick(chapter.id)}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{chapter.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">{chapter.word_count} words</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    chapter.status === 'published' ? 'bg-green-100 text-green-700' :
                    chapter.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {chapter.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsPanel = () => {
    const totalWords = chapters.reduce((sum, chapter) => sum + chapter.word_count, 0);
    const completedChapters = chapters.filter(c => c.status === 'published').length;
    const totalElements = totalWorldElements + totalCharacters;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalWords}</div>
            <div className="text-sm text-slate-600">Total Words</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{chapters.length}</div>
            <div className="text-sm text-slate-600">Chapters</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedChapters}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{totalElements}</div>
            <div className="text-sm text-slate-600">World Elements</div>
          </Card>
        </div>
      </div>
    );
  };

  const renderCurrentPanel = () => {
    switch (currentPanel) {
      case 0: return renderStorylinePanel();
      case 1: return renderWorldbuildingPanel();
      case 2: return renderChaptersPanel();
      case 3: return renderAnalyticsPanel();
      default: return renderStorylinePanel();
    }
  };

  return renderCurrentPanel();
};

export default ProjectDashboardPanels;
