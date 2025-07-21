import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import OriginalTextPanel from './panels/OriginalTextPanel';
import EnhancedEditorPanel from './panels/EnhancedEditorPanel';
import ChangeTrackingPanel from './panels/ChangeTrackingPanel';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import { useProjectData } from '@/hooks/useProjectData';

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
            <OriginalTextPanel
              content={refinementData?.original_content || ''}
              chapterTitle={currentChapter?.title || ''}
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
              isTransitioning={transitionState.isTransitioning}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <ChangeTrackingPanel
              refinementId={refinementData?.id || ''}
              chapterId={currentChapter?.id || ''}
              chapterTitle={currentChapter?.title || ''}
              onChangeDecision={handleChangeDecision}
              selectedChangeId={navigationState.selectedChangeId}
              isTransitioning={transitionState.isTransitioning}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
