
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WorldbuildingPanel from './WorldbuildingPanel';
import TextEditorPanel from './TextEditorPanel';
import ChapterOrganizerPanel from './ChapterOrganizerPanel';
import StorylinePanel from './StorylinePanel';
import SimpleRightClickMenu from './simple/SimpleRightClickMenu';
import { useSimplePopups } from './simple/SimplePopupManager';

// Define ChatType locally to match the SimplePopupManager
type ChatType = 'comment' | 'chat';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string; // Added missing project_id
}

interface WritingSpaceLayoutProps {
  projectId: string;
  currentChapter: Chapter | null;
  onChapterSelect: (chapter: Chapter) => void;
  onContentChange: (content: string) => void;
  onChaptersChange?: () => void;
}

const WritingSpaceLayout = ({ 
  projectId, 
  currentChapter, 
  onChapterSelect, 
  onContentChange,
  onChaptersChange
}: WritingSpaceLayoutProps) => {
  const [overlayHeight, setOverlayHeight] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [worldbuildingRefreshTrigger, setWorldbuildingRefreshTrigger] = useState(0);
  const { createPopup } = useSimplePopups();

  const worldbuildingPanelRef = useRef<any>(null);
  const chapterOrganizerPanelRef = useRef<any>(null);

  const handleStorylineDataChange = useCallback(() => {
    console.log('Storyline data changed, refreshing worldbuilding panel...');
    setWorldbuildingRefreshTrigger(prev => prev + 1);
  }, []);

  const getCurrentPanelSizes = useCallback(() => {
    const worldbuildingSize = worldbuildingPanelRef.current?.getSize() || 25;
    const chapterOrganizerSize = chapterOrganizerPanelRef.current?.getSize() || 25;
    return {
      worldbuilding: worldbuildingSize,
      chapterOrganizer: chapterOrganizerSize,
      storyline: overlayHeight
    };
  }, [overlayHeight]);

  const areAllPanelsMinimized = useCallback(() => {
    const sizes = getCurrentPanelSizes();
    const sidePanelsMinimized = sizes.worldbuilding <= 5 && sizes.chapterOrganizer <= 5;
    const storylineMinimized = sizes.storyline <= 10;
    return sidePanelsMinimized && storylineMinimized;
  }, [getCurrentPanelSizes]);

  const handleFocusToggle = useCallback(() => {
    const panelsMinimized = areAllPanelsMinimized();
    
    if (panelsMinimized) {
      if (worldbuildingPanelRef.current) {
        worldbuildingPanelRef.current.resize(25);
      }
      if (chapterOrganizerPanelRef.current) {
        chapterOrganizerPanelRef.current.resize(25);
      }
      setOverlayHeight(30);
    } else {
      if (worldbuildingPanelRef.current) {
        worldbuildingPanelRef.current.resize(3);
      }
      if (chapterOrganizerPanelRef.current) {
        chapterOrganizerPanelRef.current.resize(3);
      }
      setOverlayHeight(5);
    }
  }, [areAllPanelsMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
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
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Simple right-click menu handler for upper panels only
  const handleUpperPanelMenuClick = (type: ChatType, position: { x: number; y: number }, selectedText?: string) => {
    // Only create popups for upper panel right-clicks (not storyline area)
    createPopup(type, position, projectId, currentChapter?.id, selectedText);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Upper area with spatial isolation for right-click menu */}
      <div 
        className="absolute inset-0"
        style={{ 
          height: `calc(100% - ${overlayHeight}%)`,
          top: 0
        }}
      >
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel 
            ref={worldbuildingPanelRef}
            defaultSize={25} 
            minSize={3}
            maxSize={40}
            className="overflow-hidden"
          >
            <SimpleRightClickMenu onMenuClick={handleUpperPanelMenuClick}>
              <WorldbuildingPanel 
                projectId={projectId} 
                refreshTrigger={worldbuildingRefreshTrigger}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30} className="overflow-hidden">
            <SimpleRightClickMenu onMenuClick={handleUpperPanelMenuClick}>
              <TextEditorPanel 
                chapter={currentChapter}
                onContentChange={onContentChange}
                areMinimized={areAllPanelsMinimized()}
                onFocusToggle={handleFocusToggle}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel 
            ref={chapterOrganizerPanelRef}
            defaultSize={25} 
            minSize={3}
            maxSize={40}
            className="overflow-hidden"
          >
            <SimpleRightClickMenu onMenuClick={handleUpperPanelMenuClick}>
              <ChapterOrganizerPanel 
                projectId={projectId}
                currentChapter={currentChapter}
                onChapterSelect={onChapterSelect}
                onChaptersChange={onChaptersChange}
              />
            </SimpleRightClickMenu>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Lower area - Storyline Panel (isolated from upper right-click menu) */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 transition-all duration-200 ease-out z-[1000] overflow-hidden"
        style={{ height: `${overlayHeight}%` }}
      >
        {/* Drag Handle - RESTORED */}
        <div
          className="w-full h-6 bg-slate-100 border-b border-slate-300 cursor-ns-resize flex items-center justify-center hover:bg-slate-200 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex space-x-1">
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>

        <div className="h-[calc(100%-24px)] overflow-hidden">
          {/* StorylinePanel has its own context menu system - no SimpleRightClickMenu wrapper */}
          <StorylinePanel 
            projectId={projectId}
            chapterId={currentChapter?.id}
            onDataChange={handleStorylineDataChange}
          />
        </div>
      </div>
    </div>
  );
};

export default WritingSpaceLayout;
