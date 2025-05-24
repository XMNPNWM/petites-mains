
import React from 'react';
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
  return (
    <div className="flex-1">
      <ResizablePanelGroup direction="vertical" className="h-full">
        {/* Top Panel - Horizontal Writing Panels */}
        <ResizablePanel defaultSize={70} minSize={40}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Worldbuilding Panel */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <WorldbuildingPanel projectId={projectId} />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Text Editor Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <TextEditorPanel 
                chapter={currentChapter}
                onContentChange={onContentChange}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Chapter Organizer Panel */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <ChapterOrganizerPanel 
                projectId={projectId}
                currentChapter={currentChapter}
                onChapterSelect={onChapterSelect}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom Panel - Storyline Panel (Permanent) */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <StorylinePanel 
            projectId={projectId}
            chapterId={currentChapter?.id}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default WritingSpaceLayout;
