
import React from 'react';
import { useParams } from 'react-router-dom';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import { useNotifications } from '@/hooks/useNotifications';
import RefinementSpaceHeader from '@/components/features/refinement/RefinementSpaceHeader';
import RefinementSpaceLayout from '@/components/features/refinement/RefinementSpaceLayout';
import FloatingNotificationContainer from '@/components/features/refinement/components/FloatingNotificationContainer';
import { SimplePopupProvider } from '@/components/features/writing/simple/SimplePopupManager';
import SimplePopupRenderer from '@/components/features/writing/simple/SimplePopupRenderer';

const RefinementSpace = () => {
  const { projectId } = useParams();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const {
    project,
    chapters,
    currentChapter,
    refinementData,
    isSaving,
    lastSaved,
    handleChapterSelect,
    handleContentChange,
    handleChangeDecision,
    handleBackClick,
    handleSave,
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
          onSave={handleSave}
          isSaving={isSaving}
          lastSaved={lastSaved}
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
          addNotification={addNotification}
        />
        <SimplePopupRenderer />
        <FloatingNotificationContainer 
          notifications={notifications}
          onDismiss={removeNotification}
        />
      </div>
    </SimplePopupProvider>
  );
};

export default RefinementSpace;
