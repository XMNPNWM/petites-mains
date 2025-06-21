
import React from 'react';
import { useParams } from 'react-router-dom';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import RefinementSpaceHeader from '@/components/features/refinement/RefinementSpaceHeader';
import RefinementSpaceLayout from '@/components/features/refinement/RefinementSpaceLayout';
import { SimplePopupProvider } from '@/components/features/writing/simple/SimplePopupManager';
import SimplePopupRenderer from '@/components/features/writing/simple/SimplePopupRenderer';

const RefinementSpace = () => {
  const { projectId } = useParams();
  const {
    project,
    chapters,
    currentChapter,
    refinementData,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    refreshData
  } = useRefinementSpace(projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading refinement space...</p>
        </div>
      </div>
    );
  }

  return (
    <SimplePopupProvider>
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        <RefinementSpaceHeader
          project={project}
          currentChapter={currentChapter}
          onBackClick={handleBackClick}
        />
        <RefinementSpaceLayout
          projectId={projectId!}
          chapters={chapters}
          currentChapter={currentChapter}
          refinementData={refinementData}
          onChapterSelect={handleChapterSelect}
          onContentChange={handleContentChange}
          onChangeDecision={handleChangeDecision}
          onRefresh={refreshData}
        />
        <SimplePopupRenderer />
      </div>
    </SimplePopupProvider>
  );
};

export default RefinementSpace;
