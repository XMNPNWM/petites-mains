
import React, { useState, useCallback, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import OriginalTextPanel from '../panels/OriginalTextPanel';
import EnhancedEditorPanel from '../panels/EnhancedEditorPanel';
import ChangeTrackingPanel from '../panels/ChangeTrackingPanel';
import ImportButton from './ImportButton';
import { Chapter, RefinementData, AIChange, ChapterTransitionState, NavigationState } from '@/types/shared';
import { EnhancementOptions } from '@/types/enhancement';
import { ContentVersioningService } from '@/services/ContentVersioningService';

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
  onImportToCreation: () => Promise<void>;
  isEnhancing: boolean;
  onEnhanceChapter: (options: EnhancementOptions) => void;
  hasEnhancedContent: boolean;
  transitionState: ChapterTransitionState;
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
  const [originalScrollPosition, setOriginalScrollPosition] = useState(0);
  const [enhancedScrollPosition, setEnhancedScrollPosition] = useState(0);
  const [hasContentConflict, setHasContentConflict] = useState(false);

  // Enhanced debugging for navigation state changes
  useEffect(() => {
    console.log('🧭 RefinementMainPanels: Navigation state changed:', {
      selectedChangeId: navigationState.selectedChangeId,
      highlightedRange: navigationState.highlightedRange,
      originalScrollPosition: navigationState.originalScrollPosition,
      enhancedScrollPosition: navigationState.enhancedScrollPosition,
      currentChapter: currentChapter?.id,
      hasRefinementData: !!refinementData
    });
  }, [navigationState, currentChapter?.id, refinementData]);

  // Enhanced debugging for transition state changes
  useEffect(() => {
    console.log('🔄 RefinementMainPanels: Transition state changed:', {
      isTransitioning: transitionState.isTransitioning,
      previousChapterId: transitionState.previousChapterId,
      currentChapterId: transitionState.currentChapterId,
      currentChapter: currentChapter?.id
    });
  }, [transitionState, currentChapter?.id]);

  // Check for content conflicts
  useEffect(() => {
    const checkContentConflict = async () => {
      if (refinementData && currentChapter) {
        try {
          const conflict = await ContentVersioningService.checkContentConflict(
            currentChapter.id,
            refinementData.id
          );
          setHasContentConflict(conflict.hasConflict);
        } catch (error) {
          console.error('Error checking content conflict:', error);
          setHasContentConflict(false);
        }
      }
    };

    checkContentConflict();
  }, [refinementData, currentChapter]);

  // Handle scroll synchronization between panels
  const handleOriginalScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    if (scrollHeight > 0 && clientHeight > 0) {
      const scrollRatio = scrollTop / Math.max(1, scrollHeight - clientHeight);
      setOriginalScrollPosition(scrollTop);
      
      // Dispatch scroll sync event for other panels
      window.dispatchEvent(new CustomEvent('scrollSync', {
        detail: { sourcePanel: 'original', scrollRatio }
      }));
    }
  }, []);

  const handleEnhancedScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    if (scrollHeight > 0 && clientHeight > 0) {
      const scrollRatio = scrollTop / Math.max(1, scrollHeight - clientHeight);
      setEnhancedScrollPosition(scrollTop);
      
      // Dispatch scroll sync event for other panels
      window.dispatchEvent(new CustomEvent('scrollSync', {
        detail: { sourcePanel: 'enhanced', scrollRatio }
      }));
    }
  }, []);

  // Enhanced change click handler with debugging
  const handleChangeClickWithDebug = useCallback((change: AIChange) => {
    console.log('🧭 RefinementMainPanels: Change clicked:', {
      changeId: change.id,
      positionStart: change.position_start,
      positionEnd: change.position_end,
      originalText: change.original_text?.substring(0, 50) + '...',
      enhancedText: change.enhanced_text?.substring(0, 50) + '...'
    });
    
    onChangeClick(change);
  }, [onChangeClick]);

  const displayData = refinementData || previousRefinementData;
  const isTransitioning = transitionState.isTransitioning;

  if (!currentChapter) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-slate-600 text-sm">Loading chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main Content Panels */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Original Content Panel - 34% */}
          <ResizablePanel defaultSize={34} minSize={20} maxSize={50}>
            <OriginalTextPanel
              content={displayData?.original_content || currentChapter.content || ''}
              chapterTitle={currentChapter.title}
              onScrollSync={handleOriginalScroll}
              scrollPosition={navigationState.originalScrollPosition}
              highlightedRange={navigationState.highlightedRange}
              hasContentConflict={hasContentConflict}
              currentChapterContent={currentChapter.content}
              isTransitioning={isTransitioning}
            />
          </ResizablePanel>

          {/* Import Button in Resizable Handle */}
          <ResizableHandle withHandle>
            <ImportButton 
              onImportToCreation={onImportToCreation}
              isDisabled={!hasEnhancedContent || isTransitioning || isEnhancing}
            />
          </ResizableHandle>

          {/* Enhanced Content Panel - 34% */}
          <ResizablePanel defaultSize={34} minSize={30}>
            <EnhancedEditorPanel
              content={displayData?.enhanced_content || ''}
              onContentChange={onContentChange}
              chapterTitle={currentChapter.title}
              chapterId={currentChapter.id}
              onScrollSync={handleEnhancedScroll}
              scrollPosition={navigationState.enhancedScrollPosition}
              highlightedRange={navigationState.highlightedRange}
              isEnhancing={isEnhancing}
              onEnhanceChapter={onEnhanceChapter}
              hasEnhancedContent={hasEnhancedContent}
              isTransitioning={isTransitioning}
              projectId={projectId}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Change Tracking Panel - 20% */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <ChangeTrackingPanel
              refinementId={displayData?.id || ''}
              onChangeDecision={onChangeDecision}
              onChangeClick={handleChangeClickWithDebug}
              selectedChangeId={navigationState.selectedChangeId}
              isTransitioning={isTransitioning}
              chapterId={currentChapter?.id}
              chapterTitle={currentChapter?.title}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementMainPanels;
