
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChapterNavigationPanel from './panels/ChapterNavigationPanel';
import OriginalTextPanel from './panels/OriginalTextPanel';
import EnhancedEditorPanel from './panels/EnhancedEditorPanel';
import ChangeTrackingPanel from './panels/ChangeTrackingPanel';
import MetricsPanel from './panels/MetricsPanel';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
}

interface RefinementData {
  id: string;
  chapter_id: string;
  original_content: string;
  enhanced_content: string;
  refinement_status: 'untouched' | 'in_progress' | 'completed' | 'updated';
  ai_changes: any[];
  context_summary: string;
}

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  refinementData: RefinementData | null;
  onChapterSelect: (chapter: Chapter) => void;
  onContentChange: (content: string) => void;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onRefresh: () => void;
}

const RefinementSpaceLayout = ({
  projectId,
  chapters,
  currentChapter,
  refinementData,
  onChapterSelect,
  onContentChange,
  onChangeDecision,
  onRefresh
}: RefinementSpaceLayoutProps) => {
  const [metricsExpanded, setMetricsExpanded] = useState(false);

  return (
    <div className="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Panel 1: Chapter Navigation */}
        <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
          <ChapterNavigationPanel
            chapters={chapters}
            currentChapter={currentChapter}
            onChapterSelect={onChapterSelect}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Panel 2: Original Text */}
        <ResizablePanel 
          defaultSize={metricsExpanded ? 20 : 25} 
          minSize={15} 
          maxSize={35}
        >
          <OriginalTextPanel
            content={refinementData?.original_content || ''}
            chapterTitle={currentChapter?.title || ''}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Panel 3: Enhanced Editor */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <EnhancedEditorPanel
            content={refinementData?.enhanced_content || ''}
            onContentChange={onContentChange}
            chapterTitle={currentChapter?.title || ''}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Panel 4: Change Tracking */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <ChangeTrackingPanel
            refinementId={refinementData?.id || ''}
            onChangeDecision={onChangeDecision}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Panel 5: Metrics (Collapsible) */}
        <ResizablePanel 
          defaultSize={metricsExpanded ? 15 : 10} 
          minSize={8} 
          maxSize={20}
        >
          <MetricsPanel
            refinementId={refinementData?.id || ''}
            isExpanded={metricsExpanded}
            onToggleExpanded={() => setMetricsExpanded(!metricsExpanded)}
            content={refinementData?.enhanced_content || ''}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default RefinementSpaceLayout;
