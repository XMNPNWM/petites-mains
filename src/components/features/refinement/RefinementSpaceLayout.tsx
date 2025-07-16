
import React, { useState, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import RefinementMainPanels from './components/RefinementMainPanels';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapterId: string;
  onClose: () => void;
}

const RefinementSpaceLayout = ({ projectId, chapterId, onClose }: RefinementSpaceLayoutProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    project,
    chapters,
    currentChapter,
    refinementData,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleImportToCreation,
    refreshData
  } = useRefinementSpace(projectId);

  const handleAnalyzeChapter = useCallback(async () => {
    if (!currentChapter) return;
    
    try {
      setIsAnalyzing(true);
      await SmartAnalysisOrchestrator.analyzeChapter(projectId, currentChapter.id);
      
      // Refresh the refinement data to show the enhanced content
      refreshData();
      
    } catch (error) {
      console.error('Error analyzing chapter:', error);
      // You could add a toast notification here for better UX
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, currentChapter, refreshData]);

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
              onChapterSelect={handleChapterSelect}
              onContentChange={handleContentChange}
              onChangeDecision={handleChangeDecision}
              onImportToCreation={handleImportToCreation}
              isEnhancing={isAnalyzing}
              onEnhanceChapter={handleAnalyzeChapter}
              hasEnhancedContent={!!refinementData?.enhanced_content && refinementData.enhanced_content !== refinementData.original_content}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
