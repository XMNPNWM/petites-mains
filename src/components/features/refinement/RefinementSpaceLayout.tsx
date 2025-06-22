
import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RefinementMainPanels from './components/RefinementMainPanels';
import RefinementStorylineOverlay from './components/RefinementStorylineOverlay';
import { useSimplePopups } from '@/components/features/writing/simple/SimplePopupManager';
import { useImprovedScrollSync } from '@/hooks/useImprovedScrollSync';

// Define ChatType locally to match the SimplePopupManager
type ChatType = 'comment' | 'chat';

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

interface RefinementSpaceLayoutProps {
  projectId: string;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  refinementData: RefinementData | null;
  onChapterSelect: (chapter: Chapter) => void;
  onContentChange: (content: string) => void;
  onChangeDecision: (changeId: string, decision: 'accepted' | 'rejected') => void;
  onRefresh: () => void;
}

const RefinementSpaceLayout = ({
  projectId,
  chapters,
  currentChapter,
  refinementData,
  onChapterSelect,
  onContentChange,
  onChangeDecision,
  onRefresh
}: RefinementSpaceLayoutProps) => {
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [overlayHeight, setOverlayHeight] = useState(25);
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);
  const { createPopup } = useSimplePopups();
  const { scrollPositions, handleScrollSync } = useImprovedScrollSync();

  // Handle change click for jump navigation
  const handleChangeClick = useCallback((change: AIChange) => {
    setHighlightedRange({
      start: change.position_start,
      end: change.position_end
    });

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedRange(null);
    }, 3000);
  }, []);

  // Handle import to creation editor
  const handleImportToCreation = useCallback(async () => {
    if (!refinementData || !currentChapter) return;
    
    try {
      // Update the chapter content with enhanced content
      const { error } = await supabase
        .from('chapters')
        .update({ 
          content: refinementData.enhanced_content,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;
      
      // Show success message or navigate back
      console.log('Content imported to creation editor successfully');
    } catch (error) {
      console.error('Error importing content:', error);
    }
  }, [refinementData, currentChapter]);

  // Handle metrics panel toggle
  const handleMetricsToggle = useCallback(() => {
    setMetricsExpanded(!metricsExpanded);
  }, [metricsExpanded]);

  // Double-click handler for storyline drag handle
  const handleStorylineDragHandleDoubleClick = useCallback(() => {
    setOverlayHeight(prevHeight => prevHeight <= 10 ? 75 : 5);
  }, []);

  // Drag handle for storyline overlay
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startY = e.clientY;
    const startHeight = overlayHeight;

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const windowHeight = window.innerHeight;
      const deltaY = startY - e.clientY;
      const deltaPercent = (deltaY / windowHeight) * 100;
      const newHeight = Math.min(75, Math.max(5, startHeight + deltaPercent));
      setOverlayHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Right-click menu handler
  const handleRightClickMenuClick = (type: ChatType, position: { x: number; y: number }, selectedText?: string, lineNumber?: number) => {
    console.log('Right-click menu click in refinement space:', {
      type, 
      position, 
      selectedText, 
      lineNumber,
      currentChapterId: currentChapter?.id
    });
    
    createPopup(type, position, projectId, currentChapter?.id, selectedText, lineNumber);
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Main panels area */}
      <div 
        className="absolute inset-0"
        style={{ 
          height: `calc(100% - ${overlayHeight}%)`,
          top: 0
        }}
      >
        <RefinementMainPanels
          chapters={chapters}
          currentChapter={currentChapter}
          refinementData={refinementData}
          onChapterSelect={onChapterSelect}
          onContentChange={onContentChange}
          onChangeDecision={onChangeDecision}
          onChangeClick={handleChangeClick}
          onImportToCreation={handleImportToCreation}
          scrollPositions={scrollPositions}
          handleScrollSync={handleScrollSync}
          highlightedRange={highlightedRange}
          onRightClickMenuClick={handleRightClickMenuClick}
          metricsExpanded={metricsExpanded}
          onMetricsToggle={handleMetricsToggle}
        />
      </div>

      {/* Storyline Panel Overlay */}
      <RefinementStorylineOverlay
        projectId={projectId}
        currentChapterId={currentChapter?.id}
        overlayHeight={overlayHeight}
        onRefresh={onRefresh}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleStorylineDragHandleDoubleClick}
      />
    </div>
  );
};

export default RefinementSpaceLayout;
