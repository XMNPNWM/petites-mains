
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WorldbuildingPanel from './WorldbuildingPanel';
import TextEditorPanel from './TextEditorPanel';
import ChapterOrganizerPanel from './ChapterOrganizerPanel';
import StorylinePanel from './StorylinePanel';
import WritingContextMenu from './WritingContextMenu';
import { usePopupChat } from './PopupChatManager';
import { SelectedTextContext } from '@/types/comments';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
  project_id: string;
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
  const { createPopup } = usePopupChat();

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

  const handleCommentClick = (position: { x: number; y: number }, selectedText?: SelectedTextContext, lineNumber?: number) => {
    createPopup('comment', position, projectId, currentChapter?.id, selectedText?.text, lineNumber);
  };

  const handleChatClick = (position: { x: number; y: number }) => {
    createPopup('chat', position, projectId, currentChapter?.id);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
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
            <WritingContextMenu onComment={handleCommentClick} onChat={handleChatClick}>
              <WorldbuildingPanel 
                projectId={projectId} 
                refreshTrigger={worldbuildingRefreshTrigger}
              />
            </WritingContextMenu>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30} className="overflow-hidden">
            <TextEditorPanel 
              chapter={currentChapter}
              onContentChange={onContentChange}
              areMinimized={areAllPanelsMinimized()}
              onFocusToggle={handleFocusToggle}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel 
            ref={chapterOrganizerPanelRef}
            defaultSize={25} 
            minSize={3}
            maxSize={40}
            className="overflow-hidden"
          >
            <WritingContextMenu onComment={handleCommentClick} onChat={handleChatClick}>
              <ChapterOrganizerPanel 
                projectId={projectId}
                currentChapter={currentChapter}
                onChapterSelect={onChapterSelect}
                onChaptersChange={onChaptersChange}
              />
            </WritingContextMenu>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 transition-all duration-200 ease-out z-[1000] overflow-hidden"
        style={{ height: `${overlayHeight}%` }}
      >
        <div
          className={`h-6 bg-slate-100 border-b border-slate-200 flex items-center justify-center cursor-row-resize hover:bg-slate-200 transition-colors select-none ${
            isDragging ? 'bg-slate-200' : ''
          } ${overlayHeight <= 10 ? 'bg-slate-300 hover:bg-slate-400' : ''}`}
          onMouseDown={handleMouseDown}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="flex space-x-1 pointer-events-none">
            <div className={`w-8 h-1 rounded-full ${overlayHeight <= 10 ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
            <div className={`w-8 h-1 rounded-full ${overlayHeight <= 10 ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
            <div className={`w-8 h-1 rounded-full ${overlayHeight <= 10 ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
          </div>
        </div>

        <div className="h-[calc(100%-24px)] overflow-hidden">
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
