
import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import OriginalEditorPanel from './OriginalEditorPanel';
import EnhancedEditorPanel from './EnhancedEditorPanel';
import ChangeTrackingPanel from './ChangeTrackingPanel';
import { RefinementData, AIChange } from '@/types/shared';

interface RefinementMainPanelsProps {
  projectId: string;
  chapterId: string;
  refinementData: RefinementData | null;
  onContentChange: (content: string) => void;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onImportToCreation: () => void;
  onRefreshData: () => void;
  onChangeNavigation?: (change: AIChange) => void;
  highlightedRange?: { start: number; end: number } | null;
  isEnhancing?: boolean; // NEW: Enhancement state
  startEnhancement?: () => void; // NEW: Start enhancement callback
  completeEnhancement?: () => void; // NEW: Complete enhancement callback
}

const RefinementMainPanels = ({
  projectId,
  chapterId,
  refinementData,
  onContentChange,
  onChangeDecision,
  onImportToCreation,
  onRefreshData,
  onChangeNavigation,
  highlightedRange,
  isEnhancing = false,
  startEnhancement,
  completeEnhancement
}: RefinementMainPanelsProps) => {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* Original Content Panel - 34% */}
      <ResizablePanel defaultSize={34} minSize={20} maxSize={60}>
        <OriginalEditorPanel
          refinementData={refinementData}
          highlightedRange={highlightedRange}
          chapterId={chapterId}
        />
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      {/* Enhanced Content Panel - 34% */}
      <ResizablePanel defaultSize={34} minSize={20} maxSize={60}>
        <EnhancedEditorPanel
          projectId={projectId}
          chapterId={chapterId}
          refinementData={refinementData}
          onContentChange={onContentChange}
          onImportToCreation={onImportToCreation}
          onRefreshData={onRefreshData}
          isEnhancing={isEnhancing}
          startEnhancement={startEnhancement}
          completeEnhancement={completeEnhancement}
        />
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      {/* Change Tracking Panel - 20% */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
        <ChangeTrackingPanel
          refinementData={refinementData}
          onChangeDecision={onChangeDecision}
          onChangeNavigation={onChangeNavigation}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default RefinementMainPanels;
