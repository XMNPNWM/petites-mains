
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ChapterNavigationPanel from '../panels/ChapterNavigationPanel';
import OriginalTextPanel from '../panels/OriginalTextPanel';
import EnhancedEditorPanel from '../panels/EnhancedEditorPanel';
import ChangeTrackingPanel from '../panels/ChangeTrackingPanel';
import MetricsPanel from '../panels/MetricsPanel';
import ImportButton from './ImportButton';
import MetricsToggleButton from './MetricsToggleButton';
import SimpleRightClickMenu from '@/components/features/writing/simple/SimpleRightClickMenu';
import RefinementDebugPanel from './RefinementDebugPanel';

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

import { AIChange } from '@/types/shared';

type ChatType = 'comment' | 'chat';

interface RefinementMainPanelsProps {
  projectId: string;
  chapterId: string;
  chapters?: Chapter[];
  currentChapter?: Chapter | null;
  refinementData?: RefinementData | null;
  previousRefinementData?: RefinementData | null;
  onChapterSelect?: (chapter: Chapter) => void;
  onContentChange?: (content: string) => void;
  onChangeDecision?: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onChangeClick?: (change: AIChange) => void;
  onImportToCreation?: () => Promise<void>;
  scrollPositions?: {
    original: number;
    enhanced: number;
    changeTracking: number;
  };
  handleScrollSync?: (
    panelType: 'original' | 'enhanced' | 'changeTracking',
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => void;
  highlightedRange?: { start: number; end: number } | null;
  onRightClickMenuClick?: (type: ChatType, position: { x: number; y: number }, selectedText?: string, lineNumber?: number) => void;
  metricsExpanded?: boolean;
  onMetricsToggle?: () => void;
  isEnhancing?: boolean;
  onEnhanceChapter?: (options: any) => void;
  hasEnhancedContent?: boolean;
  transitionState?: any;
  navigationState?: any;
}

const RefinementMainPanels = ({
  projectId,
  chapterId,
  chapters = [],
  currentChapter = null,
  refinementData = null,
  previousRefinementData = null,
  onChapterSelect = () => {},
  onContentChange = () => {},
  onChangeDecision = () => {},
  onChangeClick = () => {},
  onImportToCreation = async () => {},
  scrollPositions = { original: 0, enhanced: 0, changeTracking: 0 },
  handleScrollSync = () => {},
  highlightedRange = null,
  onRightClickMenuClick = () => {},
  metricsExpanded = false,
  onMetricsToggle = () => {},
  isEnhancing = false,
  onEnhanceChapter = () => {},
  hasEnhancedContent = false,
  transitionState,
  navigationState,
  ...restProps
}: RefinementMainPanelsProps) => {
  
  // SIMPLIFIED: Use current refinement data only
  const isTransitioning = transitionState?.isTransitioning || false;
  const activeRefinementData = refinementData;
  
  // PHASE 1: Enhanced content display logic with strict chapter validation
  const shouldShowContent = !!(
    activeRefinementData?.chapter_id === currentChapter?.id &&
    activeRefinementData?.enhanced_content &&
    activeRefinementData.enhanced_content.trim().length > 0 &&
    (activeRefinementData.refinement_status === 'completed' || 
     activeRefinementData.refinement_status === 'in_progress') &&
    !isTransitioning
  );

  const enhancedContent = shouldShowContent ? activeRefinementData.enhanced_content : '';
  const hasValidEnhancedContent = shouldShowContent;

  // PHASE 1: Add defensive validation
  if (activeRefinementData && currentChapter && activeRefinementData.chapter_id !== currentChapter.id) {
    console.warn('⚠️ PHASE 1: Chapter ID mismatch detected in RefinementMainPanels', {
      refinementChapterId: activeRefinementData.chapter_id,
      currentChapterId: currentChapter.id
    });
  }

  console.log('🎛️ RefinementMainPanels - PHASE 1: Enhanced content display logic:', {
    currentChapterId: currentChapter?.id,
    refinementChapterId: activeRefinementData?.chapter_id,
    refinementStatus: activeRefinementData?.refinement_status,
    hasEnhancedContent: !!activeRefinementData?.enhanced_content,
    enhancedContentLength: activeRefinementData?.enhanced_content?.length || 0,
    shouldShowContent,
    hasValidEnhancedContent,
    isTransitioning,
    chapterIdsMatch: activeRefinementData?.chapter_id === currentChapter?.id
  });

  return (
    <div className="h-full flex flex-col">
      {/* Debug Panel - Remove this after testing */}
      <RefinementDebugPanel
        currentChapter={currentChapter}
        refinementData={activeRefinementData}
        transitionState={transitionState}
        navigationState={navigationState}
        isVisible={true}
      />
      
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* Panel 1: Chapter Navigation */}
      <ResizablePanel defaultSize={12} minSize={8} maxSize={20}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <ChapterNavigationPanel
            chapters={chapters}
            currentChapter={currentChapter}
            onChapterSelect={onChapterSelect}
            isTransitioning={isTransitioning}
          />
        </SimpleRightClickMenu>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Panel 2: Original Text */}
      <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <OriginalTextPanel
            content={currentChapter?.content || ''}
            chapterTitle={currentChapter?.title || ''}
            onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
              handleScrollSync('original', scrollTop, scrollHeight, clientHeight)
            }
            scrollPosition={navigationState?.originalScrollPosition || scrollPositions.original}
            highlightedRange={navigationState?.highlightedRange}
            hasContentConflict={
              currentChapter?.content !== undefined && 
              activeRefinementData?.original_content !== undefined &&
              currentChapter.content !== activeRefinementData.original_content
            }
            currentChapterContent={currentChapter?.content}
            isTransitioning={isTransitioning}
          />
        </SimpleRightClickMenu>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Import Arrow Button */}
      <ImportButton 
        onImportToCreation={onImportToCreation} 
        isDisabled={isTransitioning}
      />
      
      {/* Panel 3: Enhanced Editor */}
      <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <EnhancedEditorPanel
            content={enhancedContent}
            onContentChange={onContentChange}
            chapterTitle={currentChapter?.title || ''}
            chapterId={currentChapter?.id}
            onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
              handleScrollSync('enhanced', scrollTop, scrollHeight, clientHeight)
            }
            scrollPosition={navigationState?.enhancedScrollPosition || scrollPositions.enhanced}
            highlightedRange={navigationState?.highlightedRange}
            isEnhancing={isEnhancing}
            onEnhanceChapter={onEnhanceChapter}
            hasEnhancedContent={hasValidEnhancedContent}
            isTransitioning={isTransitioning}
            projectId={projectId}
          />
        </SimpleRightClickMenu>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Panel 4: Change Tracking */}
      <ResizablePanel defaultSize={17} minSize={12} maxSize={25}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <ChangeTrackingPanel
            refinementId={activeRefinementData?.id || ''}
            onChangeDecision={onChangeDecision}
            onChangeClick={onChangeClick}
            scrollPosition={scrollPositions.changeTracking}
            onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
              handleScrollSync('changeTracking', scrollTop, scrollHeight, clientHeight)
            }
            chapterId={chapterId}
            chapterTitle={currentChapter?.title || ''}
            isTransitioning={isTransitioning}
            selectedChangeId={navigationState?.selectedChangeId}
          />
        </SimpleRightClickMenu>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Metrics Panel Toggle Button */}
      {!metricsExpanded && (
        <MetricsToggleButton onToggle={onMetricsToggle} />
      )}
      
      {/* Panel 5: Metrics (Collapsible) */}
      {metricsExpanded && (
        <>
          <ResizableHandle />
          <ResizablePanel 
            defaultSize={15} 
            minSize={12} 
            maxSize={25}
          >
            <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
              <MetricsPanel
                refinementId={activeRefinementData?.id || ''}
                isExpanded={metricsExpanded}
                onToggleExpanded={onMetricsToggle}
                content={enhancedContent}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
    </div>
  );
};

export default RefinementMainPanels;
