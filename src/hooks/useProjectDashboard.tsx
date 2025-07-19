
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project, Chapter } from '@/types/shared';
import { useProjectData } from './useProjectData';

export const useProjectDashboard = (projectId: string | undefined) => {
  const navigate = useNavigate();
  const { project, chapters, isLoading } = useProjectData(projectId);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [totalWorldElements, setTotalWorldElements] = useState(0);
  const [worldElementsByType, setWorldElementsByType] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchWorldbuildingData = async () => {
      if (!projectId) return;

      try {
        const { data: worldElements, error } = await supabase
          .from('worldbuilding_elements')
          .select('type')
          .eq('project_id', projectId);

        if (error) {
          console.error('Error fetching worldbuilding elements:', error);
          return;
        }

        const elementsByType: { [key: string]: number } = {};
        worldElements?.forEach(element => {
          elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
        });

        setTotalWorldElements(worldElements?.length || 0);
        setWorldElementsByType(elementsByType);
      } catch (error) {
        console.error('Error in fetchWorldbuildingData:', error);
      }
    };

    fetchWorldbuildingData();
  }, [projectId]);

  const panels = [
    { 
      id: 'storyline', 
      title: 'Storyline',
      icon: 'BookOpen'
    },
    { 
      id: 'worldbuilding', 
      title: 'World Elements',
      icon: 'Globe'
    },
    { 
      id: 'chapters', 
      title: 'Chapters',
      icon: 'Edit3'
    },
    { 
      id: 'ai-brain', 
      title: 'AI Brain',
      icon: 'Brain'
    },
    { 
      id: 'analytics', 
      title: 'Analytics',
      icon: 'BarChart3'
    }
  ];

  const updateProjectDescription = async (description: string) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ description })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project description:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update project description:', error);
      throw error;
    }
  };

  const goToWritingSpace = (chapterId: string) => {
    navigate(`/project/${projectId}/write/${chapterId}`);
  };

  const handleWriteButtonClick = () => {
    if (chapters.length === 0) {
      navigate(`/project/${projectId}/write`);
    } else {
      const lastChapter = chapters[chapters.length - 1];
      navigate(`/project/${projectId}/write/${lastChapter.id}`);
    }
  };

  const getWriteButtonText = () => {
    return chapters.length === 0 ? 'Start Writing' : 'Continue Writing';
  };

  return {
    project,
    chapters,
    currentPanel,
    setCurrentPanel,
    totalWorldElements,
    worldElementsByType,
    panels,
    updateProjectDescription,
    goToWritingSpace,
    handleWriteButtonClick,
    getWriteButtonText,
    navigate
  };
};
