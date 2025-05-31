
import React from 'react';
import { useParams } from 'react-router-dom';
import { useProjectDashboard } from '@/hooks/useProjectDashboard';
import LoadingProjectState from '@/components/features/dashboard/LoadingProjectState';
import ProjectDashboardHeader from '@/components/features/dashboard/ProjectDashboardHeader';
import ProjectDashboardNavigation from '@/components/features/dashboard/ProjectDashboardNavigation';
import ProjectDashboardPanels from '@/components/features/dashboard/ProjectDashboardPanels';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const {
    project,
    chapters,
    currentPanel,
    setCurrentPanel,
    totalWorldElements,
    totalCharacters,
    panels,
    updateProjectDescription,
    goToWritingSpace,
    handleWriteButtonClick,
    getWriteButtonText,
    navigate
  } = useProjectDashboard(projectId);

  if (!project) {
    return <LoadingProjectState />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ProjectDashboardHeader
        project={project}
        onNavigateBack={() => navigate('/')}
        onUpdateDescription={updateProjectDescription}
        onWriteButtonClick={handleWriteButtonClick}
        getWriteButtonText={getWriteButtonText}
      />

      <ProjectDashboardNavigation
        panels={panels}
        currentPanel={currentPanel}
        onPanelChange={setCurrentPanel}
      />

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className={`h-full ${currentPanel === 0 ? '' : 'px-6 py-8 overflow-y-auto'}`}>
            <ProjectDashboardPanels
              currentPanel={currentPanel}
              projectId={projectId!}
              chapters={chapters}
              totalWorldElements={totalWorldElements}
              totalCharacters={totalCharacters}
              onChapterClick={goToWritingSpace}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
