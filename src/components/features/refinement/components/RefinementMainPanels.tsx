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

interface AIChange {
  id: string;
  change_type: 'grammar' | 'structure' | 'dialogue' | 'style';
  original_text: string;
  enhanced_text: string;
  position_start: number;
  position_end: number;
  user_decision: 'accepted' | 'rejected' | 'pending';
  confidence_score: number;
}

type ChatType = 'comment' | 'chat';

interface RefinementMainPanelsProps {
  projectId: string;
  chapterId: string;
  chapters?: Chapter[];
  currentChapter?: Chapter | null;
  refinementData?: RefinementData | null;
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
}

const RefinementMainPanels = ({
  projectId,
  chapterId,
  chapters = [],
  currentChapter = null,
  refinementData = null,
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
  ...restProps
}: RefinementMainPanelsProps & { transitionState?: any }) => {
  
  // CRITICAL VALIDATION: Enhanced content display logic with proper status checking
  const shouldShowEnhancedContent = refinementData?.chapter_id === currentChapter?.id &&
    refinementData?.enhanced_content &&
    refinementData.enhanced_content.trim().length > 0 &&
    (refinementData.refinement_status === 'completed' || refinementData.refinement_status === 'in_progress');

  // Enhanced content availability for UI controls
  const hasValidEnhancedContent = shouldShowEnhancedContent && 
    refinementData?.refinement_status === 'completed';

  const isTransitioning = transitionState?.isTransitioning || false;

  console.log('🎛️ RefinementMainPanels - Enhanced content display logic:', {
    currentChapterId: currentChapter?.id,
    refinementChapterId: refinementData?.chapter_id,
    refinementStatus: refinementData?.refinement_status,
    hasEnhancedContent: !!refinementData?.enhanced_content,
    enhancedContentLength: refinementData?.enhanced_content?.length || 0,
    shouldShowEnhancedContent,
    hasValidEnhancedContent,
    isTransitioning
  });

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
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
            scrollPosition={scrollPositions.original}
            highlightedRange={highlightedRange}
            hasContentConflict={
              currentChapter?.content !== undefined && 
              refinementData?.original_content !== undefined &&
              currentChapter.content !== refinementData.original_content
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
        disabled={isTransitioning}
      />
      
      {/* Panel 3: Enhanced Editor */}
      <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <EnhancedEditorPanel
            content={shouldShowEnhancedContent ? refinementData.enhanced_content : ''}
            onContentChange={onContentChange}
            chapterTitle={currentChapter?.title || ''}
            chapterId={currentChapter?.id}
            onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
              handleScrollSync('enhanced', scrollTop, scrollHeight, clientHeight)
            }
            scrollPosition={scrollPositions.enhanced}
            isEnhancing={isEnhancing}
            onEnhanceChapter={onEnhanceChapter}
            hasEnhancedContent={hasValidEnhancedContent}
            isTransitioning={isTransitioning}
          />
        </SimpleRightClickMenu>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Panel 4: Change Tracking */}
      <ResizablePanel defaultSize={17} minSize={12} maxSize={25}>
        <SimpleRightClickMenu onMenuClick={onRightClickMenuClick}>
          <ChangeTrackingPanel
            refinementId={refinementData?.chapter_id === currentChapter?.id ? refinementData?.id || '' : ''}
            onChangeDecision={onChangeDecision}
            onChangeClick={onChangeClick}
            scrollPosition={scrollPositions.changeTracking}
            onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
              handleScrollSync('changeTracking', scrollTop, scrollHeight, clientHeight)
            }
            chapterId={chapterId}
            chapterTitle={currentChapter?.title || ''}
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
                refinementId={refinementData?.chapter_id === currentChapter?.id ? refinementData?.id || '' : ''}
                isExpanded={metricsExpanded}
                onToggleExpanded={onMetricsToggle}
                content={shouldShowEnhancedContent ? refinementData.enhanced_content : ''}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default RefinementMainPanels;
