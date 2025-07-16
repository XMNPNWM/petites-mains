
import React from 'react';
import { useParams } from 'react-router-dom';
import { useRefinementSpace } from '@/hooks/useRefinementSpace';
import { useNotifications } from '@/hooks/useNotifications';
import RefinementSpaceLayout from '@/components/features/refinement/RefinementSpaceLayout';
import FloatingNotificationContainer from '@/components/features/refinement/components/FloatingNotificationContainer';
import { SimplePopupProvider } from '@/components/features/writing/simple/SimplePopupManager';
import SimplePopupRenderer from '@/components/features/writing/simple/SimplePopupRenderer';

const RefinementSpace = () => {
  const { projectId, chapterId } = useParams();
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
    handleImportToCreation,
    refreshData
  } = useRefinementSpace(projectId);

  if (!project || !projectId || !chapterId) {
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
        <RefinementSpaceLayout
          projectId={projectId}
          chapterId={chapterId}
          onClose={handleBackClick}
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
