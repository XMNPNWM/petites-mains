
import React, { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WorldbuildingPanel from './WorldbuildingPanel';
import TextEditorPanel from './TextEditorPanel';
import ChapterOrganizerPanel from './ChapterOrganizerPanel';
import StorylinePanel from './StorylinePanel';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
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
  const [overlayHeight, setOverlayHeight] = useState(30); // Default 30% of screen height
  const [isDragging, setIsDragging] = useState(false);
  const [worldbuildingRefreshTrigger, setWorldbuildingRefreshTrigger] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Callback to refresh worldbuilding panel when storyline changes
  const handleStorylineDataChange = useCallback(() => {
    console.log('Storyline data changed, refreshing worldbuilding panel...');
    setWorldbuildingRefreshTrigger(prev => prev + 1);
  }, []);

  const handleFocusModeToggle = () => {
    setIsFocusMode(prev => !prev);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent text selection during drag
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    const startY = e.clientY;
    const startHeight = overlayHeight;

    // Add no-select class to body to prevent text selection everywhere
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const windowHeight = window.innerHeight;
      const deltaY = startY - e.clientY;
      const deltaPercent = (deltaY / windowHeight) * 100;
      const newHeight = Math.min(75, Math.max(10, startHeight + deltaPercent));
      setOverlayHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate the storyline height based on focus mode
  const storylineHeight = isFocusMode ? 6 : overlayHeight;

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Main Horizontal Panels - Calculate height to account for overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          height: `calc(100% - ${storylineHeight}px)`,
          top: 0
        }}
      >
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Worldbuilding Panel - Hidden in focus mode */}
          {!isFocusMode && (
            <>
              <ResizablePanel defaultSize={25} minSize={20} className="overflow-hidden">
                <WorldbuildingPanel 
                  projectId={projectId} 
                  refreshTrigger={worldbuildingRefreshTrigger}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          {/* Text Editor Panel - Expanded in focus mode */}
          <ResizablePanel 
            defaultSize={isFocusMode ? 100 : 50} 
            minSize={30} 
            className="overflow-hidden"
          >
            <TextEditorPanel 
              chapter={currentChapter}
              onContentChange={onContentChange}
              isFocusMode={isFocusMode}
              onFocusModeToggle={handleFocusModeToggle}
            />
          </ResizablePanel>
          
          {/* Chapter Organizer Panel - Hidden in focus mode */}
          {!isFocusMode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} className="overflow-hidden">
                <ChapterOrganizerPanel 
                  projectId={projectId}
                  currentChapter={currentChapter}
                  onChapterSelect={onChapterSelect}
                  onChaptersChange={onChaptersChange}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Storyline Overlay Panel - Always visible but minimized in focus mode */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 z-10 overflow-hidden"
        style={{ height: `${storylineHeight}px` }}
      >
        {/* Drag Handle */}
        <div
          className={`h-6 bg-slate-100 border-b border-slate-200 flex items-center justify-center cursor-row-resize hover:bg-slate-200 transition-colors select-none ${
            isDragging ? 'bg-slate-200' : ''
          }`}
          onMouseDown={handleMouseDown}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="flex space-x-1 pointer-events-none">
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>

        {/* Storyline Panel Content - Hidden when in focus mode and height is minimal */}
        {storylineHeight > 6 && (
          <div className="h-[calc(100%-24px)] overflow-hidden">
            <StorylinePanel 
              projectId={projectId}
              chapterId={currentChapter?.id}
              onDataChange={handleStorylineDataChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingSpaceLayout;
