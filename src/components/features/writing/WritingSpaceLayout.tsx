
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
}

const WritingSpaceLayout = ({ 
  projectId, 
  currentChapter, 
  onChapterSelect, 
  onContentChange 
}: WritingSpaceLayoutProps) => {
  const [overlayHeight, setOverlayHeight] = useState(30); // Default 30% of screen height
  const [isDragging, setIsDragging] = useState(false);
  const [worldbuildingRefreshTrigger, setWorldbuildingRefreshTrigger] = useState(0);

  // Callback to refresh worldbuilding panel when storyline changes
  const handleStorylineDataChange = useCallback(() => {
    console.log('Storyline data changed, refreshing worldbuilding panel...');
    setWorldbuildingRefreshTrigger(prev => prev + 1);
  }, []);

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

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Main Horizontal Panels - Calculate height to account for overlay */}
      <div 
        className="absolute inset-0"
        style={{ 
          height: `calc(100% - ${overlayHeight}%)`,
          top: 0
        }}
      >
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Worldbuilding Panel */}
          <ResizablePanel defaultSize={25} minSize={20} className="overflow-hidden">
            <WorldbuildingPanel 
              projectId={projectId} 
              refreshTrigger={worldbuildingRefreshTrigger}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Text Editor Panel */}
          <ResizablePanel defaultSize={50} minSize={30} className="overflow-hidden">
            <TextEditorPanel 
              chapter={currentChapter}
              onContentChange={onContentChange}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Chapter Organizer Panel */}
          <ResizablePanel defaultSize={25} minSize={20} className="overflow-hidden">
            <ChapterOrganizerPanel 
              projectId={projectId}
              currentChapter={currentChapter}
              onChapterSelect={onChapterSelect}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Storyline Overlay Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 transition-all duration-200 ease-out z-10 overflow-hidden"
        style={{ height: `${overlayHeight}%` }}
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

        {/* Storyline Panel Content */}
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
