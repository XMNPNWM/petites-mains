
import React, { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ChapterNavigationPanel from './panels/ChapterNavigationPanel';
import OriginalTextPanel from './panels/OriginalTextPanel';
import EnhancedEditorPanel from './panels/EnhancedEditorPanel';
import ChangeTrackingPanel from './panels/ChangeTrackingPanel';
import MetricsPanel from './panels/MetricsPanel';
import StorylinePanel from '@/components/features/writing/StorylinePanel';
import SimpleRightClickMenu from '@/components/features/writing/simple/SimpleRightClickMenu';
import { useSimplePopups } from '@/components/features/writing/simple/SimplePopupManager';
import { useScrollSync } from '@/hooks/useScrollSync';

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
  const [overlayHeight, setOverlayHeight] = useState(30);
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);
  const { createPopup } = useSimplePopups();
  const { scrollPositions, handleScrollSync } = useScrollSync();

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
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Panel 1: Chapter Navigation */}
          <ResizablePanel defaultSize={15} minSize={12} maxSize={25}>
            <SimpleRightClickMenu onMenuClick={handleRightClickMenuClick}>
              <ChapterNavigationPanel
                chapters={chapters}
                currentChapter={currentChapter}
                onChapterSelect={onChapterSelect}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Panel 2: Original Text */}
          <ResizablePanel 
            defaultSize={metricsExpanded ? 15 : 25} 
            minSize={metricsExpanded ? 5 : 15} 
            maxSize={35}
          >
            <SimpleRightClickMenu onMenuClick={handleRightClickMenuClick}>
              <OriginalTextPanel
                content={refinementData?.original_content || ''}
                chapterTitle={currentChapter?.title || ''}
                onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
                  handleScrollSync('original', scrollTop, scrollHeight, clientHeight)
                }
                scrollPosition={scrollPositions.original}
                highlightedRange={highlightedRange}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Import Arrow Button */}
          <div className="flex items-center justify-center w-8 bg-slate-100 border-x border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportToCreation}
              className="p-1 h-auto"
              title="Import to Creation Editor"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600" />
            </Button>
          </div>
          
          {/* Panel 3: Enhanced Editor */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <SimpleRightClickMenu onMenuClick={handleRightClickMenuClick}>
              <EnhancedEditorPanel
                content={refinementData?.enhanced_content || ''}
                onContentChange={onContentChange}
                chapterTitle={currentChapter?.title || ''}
                onScrollSync={(scrollTop, scrollHeight, clientHeight) => 
                  handleScrollSync('enhanced', scrollTop, scrollHeight, clientHeight)
                }
                scrollPosition={scrollPositions.enhanced}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Panel 4: Change Tracking */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <SimpleRightClickMenu onMenuClick={handleRightClickMenuClick}>
              <ChangeTrackingPanel
                refinementId={refinementData?.id || ''}
                onChangeDecision={onChangeDecision}
                onChangeClick={handleChangeClick}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Metrics Panel Toggle Button */}
          {!metricsExpanded && (
            <div className="flex items-center justify-center w-6 bg-slate-50 border-l border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMetricsToggle}
                className="p-1 h-auto rotate-180"
                title="Show Metrics"
              >
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </Button>
            </div>
          )}
          
          {/* Panel 5: Metrics (Collapsible) */}
          {metricsExpanded && (
            <>
              <ResizableHandle />
              <ResizablePanel 
                defaultSize={20} 
                minSize={15} 
                maxSize={25}
              >
                <SimpleRightClickMenu onMenuClick={handleRightClickMenuClick}>
                  <MetricsPanel
                    refinementId={refinementData?.id || ''}
                    isExpanded={metricsExpanded}
                    onToggleExpanded={handleMetricsToggle}
                    content={refinementData?.enhanced_content || ''}
                  />
                </SimpleRightClickMenu>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Storyline Panel Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 transition-all duration-200 ease-out z-[1000] overflow-hidden"
        style={{ height: `${overlayHeight}%` }}
      >
        {/* Drag Handle with Double-Click Support */}
        <div
          className="w-full h-6 bg-slate-100 border-b border-slate-300 cursor-ns-resize flex items-center justify-center hover:bg-slate-200 transition-colors"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleStorylineDragHandleDoubleClick}
        >
          <div className="flex space-x-1">
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>

        <div className="h-[calc(100%-24px)] overflow-hidden">
          <StorylinePanel 
            projectId={projectId}
            chapterId={currentChapter?.id}
            onDataChange={onRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default RefinementSpaceLayout;
