
import React from 'react';
import { Card } from '@/components/ui/card';
import ReadOnlyStorylineViewer from './ReadOnlyStorylineViewer';
import UnifiedWorldbuildingPanel from './UnifiedWorldbuildingPanel';
import EnhancedAIBrainPanel from './EnhancedAIBrainPanel';
import WritingTrendsChart from '../analytics/WritingTrendsChart';
import WritingHeatmap from '../analytics/WritingHeatmap';
import ContentBreakdownChart from '../analytics/ContentBreakdownChart';
import ProjectInsights from '../analytics/ProjectInsights';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  status: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

interface WorldbuildingElementsByType {
  [type: string]: number;
}

interface ProjectDashboardPanelsProps {
  currentPanel: number;
  projectId: string;
  chapters: Chapter[];
  totalWorldElements: number;
  worldElementsByType: WorldbuildingElementsByType;
  onChapterClick: (chapterId: string) => void;
}

const ProjectDashboardPanels = ({
  currentPanel,
  projectId,
  chapters,
  totalWorldElements,
  worldElementsByType,
  onChapterClick
}: ProjectDashboardPanelsProps) => {
  // Add default timestamps for chapters that don't have them (for backward compatibility)
  const chaptersWithTimestamps = chapters.map(chapter => ({
    ...chapter,
    created_at: chapter.created_at || new Date().toISOString(),
    updated_at: chapter.updated_at || new Date().toISOString()
  }));

  const analytics = useProjectAnalytics(chaptersWithTimestamps, totalWorldElements, worldElementsByType);

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

  const renderAIBrainPanel = () => (
    <div className="h-full overflow-y-auto">
      <EnhancedAIBrainPanel projectId={projectId} />
    </div>
  );

  const renderAnalyticsPanel = () => {
    const totalWords = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Project Analytics</h3>
          <div className="text-sm text-slate-500">
            Celebrating your creative journey
          </div>
        </div>

        {/* Overview metrics - removed characters count */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalWords.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Words</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{chapters.length}</div>
            <div className="text-sm text-slate-600">Chapters</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.writingPatterns.publishedChapters}</div>
            <div className="text-sm text-slate-600">Published</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{totalWorldElements}</div>
            <div className="text-sm text-slate-600">World Elements</div>
          </Card>
        </div>

        {/* Enhanced analytics visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WritingTrendsChart data={analytics.velocityData} />
          <ContentBreakdownChart data={analytics.contentBreakdown} />
        </div>

        <WritingHeatmap data={analytics.heatmapData} />

        <div>
          <h4 className="text-md font-semibold text-slate-900 mb-4">Writing Insights</h4>
          <ProjectInsights patterns={analytics.writingPatterns} />
        </div>
      </div>
    );
  };

  const renderCurrentPanel = () => {
    switch (currentPanel) {
      case 0: return renderStorylinePanel();
      case 1: return renderWorldbuildingPanel();
      case 2: return renderChaptersPanel();
      case 3: return renderAIBrainPanel();
      case 4: return renderAnalyticsPanel();
      default: return renderStorylinePanel();
    }
  };

  return renderCurrentPanel();
};

export default ProjectDashboardPanels;
