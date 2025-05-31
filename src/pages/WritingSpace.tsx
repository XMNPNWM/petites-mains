
import React, { useState } from 'react';
import { useWritingSpace } from '@/hooks/useWritingSpace';
import WritingSpaceHeader from '@/components/features/writing/WritingSpaceHeader';
import WritingSpaceLayout from '@/components/features/writing/WritingSpaceLayout';

const WritingSpace = () => {
  const [chapters, setChapters] = useState([]);
  
  const {
    projectId,
    project,
    currentChapter,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleSave,
    handleContentChange,
    handleBackClick
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
        onChaptersChange={setChapters}
      />
    </div>
  );
};

export default WritingSpace;
