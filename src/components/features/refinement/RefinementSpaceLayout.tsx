import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import OriginalContentPanel from './panels/OriginalContentPanel';
import EnhancedEditorPanel from './panels/EnhancedEditorPanel';
import ChangesReviewPanel from './panels/ChangesReviewPanel';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import { useProjectData } from '@/hooks/useProjectData';
import { useEnhancementProcessor } from '@/hooks/useEnhancementProcessor';

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapterId: string;
  onClose: () => void;
}

const RefinementSpaceLayout = ({ projectId, chapterId, onClose }: RefinementSpaceLayoutProps) => {
  const {
    project,
    chapters,
    currentChapter,
    refinementData,
    isSaving,
    lastSaved,
    transitionState,
    navigationState,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleSave,
    clearChangeNavigation
  } = useRefinementSpace(projectId);

  const { chapters: allChapters } = useProjectData(projectId);

  const {
    isEnhancing,
    enhanceChapter,
    hasEnhancedContent
  } = useEnhancementProcessor(
    currentChapter?.id || '',
    refinementData,
    handleContentChange
  );

  return (
    <div className="h-full flex flex-col">
      <RefinementSpaceHeader
        project={project}
        currentChapter={currentChapter}
        onBackClick={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <OriginalContentPanel
              content={refinementData?.original_content || ''}
              chapterTitle={currentChapter?.title || ''}
              chapters={chapters}
              currentChapter={currentChapter}
              onChapterSelect={handleChapterSelect}
              isTransitioning={transitionState.isTransitioning}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <EnhancedEditorPanel
              content={refinementData?.enhanced_content || ''}
              onContentChange={handleContentChange}
              chapterTitle={currentChapter?.title || ''}
              chapterId={currentChapter?.id}
              projectId={projectId}
              totalChapters={allChapters.length}
              isEnhancing={isEnhancing}
              onEnhanceChapter={enhanceChapter}
              hasEnhancedContent={hasEnhancedContent}
              isTransitioning={transitionState.isTransitioning}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <ChangesReviewPanel
              originalContent={refinementData?.original_content || ''}
              enhancedContent={refinementData?.enhanced_content || ''}
              chapterId={currentChapter?.id || ''}
              onChangeDecision={handleChangeDecision}
              selectedChangeId={navigationState.selectedChangeId}
              onChangeNavigation={clearChangeNavigation}
              isTransitioning={transitionState.isTransitioning}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
