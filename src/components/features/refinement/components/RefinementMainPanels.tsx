
import React, { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import OriginalTextPanel from '../panels/OriginalTextPanel';
import EnhancedEditorPanel from '../panels/EnhancedEditorPanel';
import ChangeTrackingPanel from '../panels/ChangeTrackingPanel';
import { Chapter, RefinementData, AIChange } from '@/types/shared';
import { TransitionState } from '@/hooks/useChapterTransition';
import { NavigationState } from '@/services/ChangeNavigationService';
import { EnhancementOptions } from '@/types/enhancement';

interface RefinementMainPanelsProps {
  projectId: string;
  chapterId: string;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  refinementData: RefinementData | null;
  previousRefinementData: RefinementData | null;
  onChapterSelect: (chapter: Chapter) => void;
  onContentChange: (content: string) => void;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onChangeClick: (change: AIChange) => void;
  onImportToCreation: () => void;
  isEnhancing: boolean;
  onEnhanceChapter: (options: EnhancementOptions) => void;
  hasEnhancedContent: boolean;
  transitionState: TransitionState;
  navigationState: NavigationState;
}

const RefinementMainPanels = ({
  projectId,
  chapterId,
  chapters,
  currentChapter,
  refinementData,
  previousRefinementData,
  onChapterSelect,
  onContentChange,
  onChangeDecision,
  onChangeClick,
  onImportToCreation,
  isEnhancing,
  onEnhanceChapter,
  hasEnhancedContent,
  transitionState,
  navigationState
}: RefinementMainPanelsProps) => {
  const [scrollPositions, setScrollPositions] = useState<{
    original: number;
    enhanced: number;
  }>({ original: 0, enhanced: 0 });

  const handleOriginalScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const scrollPercent = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
    setScrollPositions(prev => ({ ...prev, original: scrollPercent }));
  }, []);

  const handleEnhancedScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    const scrollPercent = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
    setScrollPositions(prev => ({ ...prev, enhanced: scrollPercent }));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Original Content Panel */}
        <ResizablePanel defaultSize={33} minSize={25}>
          <OriginalTextPanel
            content={refinementData?.original_content || ''}
            chapterTitle={currentChapter?.title || ''}
            chapters={chapters}
            currentChapter={currentChapter}
            onChapterSelect={onChapterSelect}
            onScrollSync={handleOriginalScroll}
            scrollPosition={scrollPositions.enhanced}
            highlightedRange={navigationState.highlightedRange?.original || null}
            isTransitioning={transitionState.isTransitioning}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Enhanced Content Panel */}
        <ResizablePanel defaultSize={34} minSize={25}>
          <EnhancedEditorPanel
            content={refinementData?.enhanced_content || ''}
            onContentChange={onContentChange}
            chapterTitle={currentChapter?.title || ''}
            chapterId={currentChapter?.id}
            onScrollSync={handleEnhancedScroll}
            scrollPosition={scrollPositions.original}
            highlightedRange={navigationState.highlightedRange?.enhanced || null}
            isEnhancing={isEnhancing}
            onEnhanceChapter={onEnhanceChapter}
            hasEnhancedContent={hasEnhancedContent}
            isTransitioning={transitionState.isTransitioning}
            projectId={projectId}
            totalChapters={chapters.length}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Changes Review Panel */}
        <ResizablePanel defaultSize={33} minSize={25}>
          <ChangeTrackingPanel
            refinementData={refinementData}
            previousRefinementData={previousRefinementData}
            onChangeDecision={onChangeDecision}
            onChangeClick={onChangeClick}
            onImportToCreation={onImportToCreation}
            isEnhancing={isEnhancing}
            hasEnhancedContent={hasEnhancedContent}
            selectedChangeId={navigationState.selectedChangeId}
            isTransitioning={transitionState.isTransitioning}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default RefinementMainPanels;
