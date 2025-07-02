
import React, { useState, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RefinementSpaceHeader from './RefinementSpaceHeader';
import RefinementMainPanels from './components/RefinementMainPanels';
import { SmartAnalysisOrchestrator } from '@/services/SmartAnalysisOrchestrator';

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapterId: string;
  onClose: () => void;
}

const RefinementSpaceLayout = ({ projectId, chapterId, onClose }: RefinementSpaceLayoutProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeChapter = useCallback(async () => {
    try {
      setIsAnalyzing(true);
      await SmartAnalysisOrchestrator.analyzeChapter(projectId, chapterId);
    } catch (error) {
      console.error('Error analyzing chapter:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectId, chapterId]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <RefinementSpaceHeader 
        onBackClick={onClose}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleAnalyzeChapter}
      />
      
      <Separator />
      
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={100} minSize={30}>
            <RefinementMainPanels 
              projectId={projectId}
              chapterId={chapterId}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
