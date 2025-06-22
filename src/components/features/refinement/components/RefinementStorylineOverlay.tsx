
import React from 'react';
import StorylinePanel from '@/components/features/writing/StorylinePanel';

interface RefinementStorylineOverlayProps {
  projectId: string;
  currentChapterId: string | undefined;
  overlayHeight: number;
  onRefresh: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const RefinementStorylineOverlay = ({
  projectId,
  currentChapterId,
  overlayHeight,
  onRefresh,
  onMouseDown,
  onDoubleClick
}: RefinementStorylineOverlayProps) => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-slate-300 transition-all duration-200 ease-out z-[1000] overflow-hidden"
      style={{ height: `${overlayHeight}%` }}
    >
      {/* Drag Handle with Double-Click Support */}
      <div
        className="w-full h-6 bg-slate-100 border-b border-slate-300 cursor-ns-resize flex items-center justify-center hover:bg-slate-200 transition-colors"
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
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
          chapterId={currentChapterId}
          onDataChange={onRefresh}
        />
      </div>
    </div>
  );
};

export default RefinementStorylineOverlay;
