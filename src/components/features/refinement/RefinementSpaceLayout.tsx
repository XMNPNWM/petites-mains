import React, { useState, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import RefinementMainPanels from './components/RefinementMainPanels';
import { EnhancementService } from '@/services/EnhancementService';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import { useSimplePopups } from '@/components/features/writing/simple/SimplePopupManager';

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapterId: string;
  onClose: () => void;
}

type ChatType = 'comment' | 'chat';

const RefinementSpaceLayout = ({ projectId, chapterId, onClose }: RefinementSpaceLayoutProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { createPopup } = useSimplePopups();
  const {
    project,
    chapters,
    currentChapter,
    refinementData,
    previousRefinementData,
    transitionState,
    navigationState,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleChangeNavigation,
    handleImportToCreation,
    refreshData
  } = useRefinementSpace(projectId);

  const handleAnalyzeChapter = useCallback(async () => {
    if (!currentChapter) return;
    
    try {
      setIsAnalyzing(true);
      await EnhancementService.enhanceChapter(projectId, currentChapter.id, refreshData);
      
    } catch (error) {
      console.error('Error analyzing chapter:', error);
      // You could add a toast notification here for better UX
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, currentChapter, refreshData]);

  // PHASE 1: Add right-click popup handler (matches WritingSpaceLayout pattern)
  const handleRightClickMenuClick = useCallback((type: ChatType, position: { x: number; y: number }, selectedText?: string, lineNumber?: number) => {
    console.log('Refinement space right-click menu click:', {
      type, 
      position, 
      selectedText, 
      lineNumber,
      currentChapterId: currentChapter?.id
    });
    
    // Create popup with all parameters including lineNumber
    createPopup(type, position, projectId, currentChapter?.id, selectedText, lineNumber);
  }, [createPopup, projectId, currentChapter?.id]);

  // Set initial chapter if available
  useEffect(() => {
    if (chapters.length > 0 && chapterId && !currentChapter) {
      const targetChapter = chapters.find(c => c.id === chapterId);
      if (targetChapter) {
        handleChapterSelect(targetChapter);
      } else if (chapters.length > 0) {
        handleChapterSelect(chapters[0]);
      }
    }
  }, [chapters, chapterId, currentChapter, handleChapterSelect]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <RefinementSpaceHeader 
        project={project}
        currentChapter={currentChapter}
        onBackClick={onClose}
      />
      
      <Separator />
      
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={100} minSize={30}>
            <RefinementMainPanels 
              projectId={projectId}
              chapterId={chapterId}
              chapters={chapters}
              currentChapter={currentChapter}
              refinementData={refinementData}
              previousRefinementData={previousRefinementData}
              onChapterSelect={handleChapterSelect}
              onContentChange={handleContentChange}
              onChangeDecision={handleChangeDecision}
              onChangeClick={handleChangeNavigation}
              onRightClickMenuClick={handleRightClickMenuClick}
              onImportToCreation={handleImportToCreation}
              isEnhancing={isAnalyzing}
              onEnhanceChapter={handleAnalyzeChapter}
              hasEnhancedContent={!!(refinementData?.enhanced_content && refinementData.enhanced_content.trim().length > 0)}
              transitionState={transitionState}
              navigationState={navigationState}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
