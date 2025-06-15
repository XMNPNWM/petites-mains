
import React from 'react';
import { useWritingSpace } from '@/hooks/useWritingSpace';
import WritingSpaceHeader from '@/components/features/writing/WritingSpaceHeader';
import WritingSpaceLayout from '@/components/features/writing/WritingSpaceLayout';
import { SimplePopupProvider } from '@/components/features/writing/simple/SimplePopupManager';
import SimplePopupRenderer from '@/components/features/writing/simple/SimplePopupRenderer';

const WritingSpace = () => {
  const {
    projectId,
    project,
    chapters,
    currentChapter,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleSave,
    handleContentChange,
    handleBackClick,
    refreshChapters
  } = useWritingSpace();

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading writing space...</p>
        </div>
      </div>
    );
  }

  return (
    <SimplePopupProvider>
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        <WritingSpaceHeader
          project={project}
          currentChapter={currentChapter}
          chapters={chapters}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onBackClick={handleBackClick}
          onSave={handleSave}
        />
        <WritingSpaceLayout
          projectId={projectId!}
          currentChapter={currentChapter}
          onChapterSelect={handleChapterSelect}
          onContentChange={handleContentChange}
          onChaptersChange={refreshChapters}
        />
        <SimplePopupRenderer />
      </div>
    </SimplePopupProvider>
  );
};

export default WritingSpace;
