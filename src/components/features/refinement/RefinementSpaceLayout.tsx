
import React, { useState, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import RefinementMainPanels from './components/RefinementMainPanels';
import { EnhancementService } from '@/services/EnhancementService';
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
          {/* Chapter Navigation Panel - Left Sidebar - Fixed at 12% */}
          <ResizablePanel defaultSize={12} minSize={12} maxSize={12}>
            <div className="h-full bg-slate-50 border-r border-slate-200">
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Chapters</h3>
                <div className="space-y-1">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterSelect(chapter)}
                      disabled={transitionState.isTransitioning}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        currentChapter?.id === chapter.id
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'hover:bg-slate-100 text-slate-600'
                      } ${transitionState.isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">Chapter {index + 1}</div>
                      <div className="text-xs opacity-75 truncate">{chapter.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Main Content Panels - 88% total */}
          <ResizablePanel defaultSize={88} minSize={70}>
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
