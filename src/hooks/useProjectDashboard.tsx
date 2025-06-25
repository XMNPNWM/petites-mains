import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_active_chapter_id?: string;
}

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  status: string;
  order_index: number;
}

interface WorldbuildingElementsByType {
  [type: string]: number;
}

export const useProjectDashboard = (projectId: string | undefined) => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [totalWorldElements, setTotalWorldElements] = useState(0);
  const [worldElementsByType, setWorldElementsByType] = useState<WorldbuildingElementsByType>({});

  const panels = [
    { id: 'storyline', title: 'Storyline', icon: 'BookOpen' },
    { id: 'worldbuilding', title: 'World Elements', icon: 'Globe' },
    { id: 'chapters', title: 'Chapters', icon: 'Edit3' },
    { id: 'ai-brain', title: 'AI Brain', icon: 'Brain' },
    { id: 'analytics', title: 'Analytics', icon: 'BarChart3' }
  ];

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch chapters with timestamps for analytics
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*, created_at, updated_at')
        .eq('project_id', projectId)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Fetch worldbuilding elements with type breakdown
      const { data: worldData, error: worldError } = await supabase
        .from('worldbuilding_elements')
        .select('type')
        .eq('project_id', projectId);

      if (worldError) throw worldError;
      
      // Group worldbuilding elements by type
      const elementsByType = (worldData || []).reduce((acc, element) => {
        acc[element.type] = (acc[element.type] || 0) + 1;
        return acc;
      }, {} as WorldbuildingElementsByType);

      setWorldElementsByType(elementsByType);
      setTotalWorldElements((worldData || []).length);

    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const updateProjectDescription = async (newDescription: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: newDescription })
        .eq('id', project.id);

      if (error) throw error;
      
      setProject(prev => prev ? { ...prev, description: newDescription } : null);
    } catch (error) {
      console.error('Error updating project description:', error);
      throw error;
    }
  };

  const goToWritingSpace = (chapterId?: string) => {
    const route = chapterId 
      ? `/project/${projectId}/write/${chapterId}`
      : `/project/${projectId}/write`;
    navigate(route);
  };

  const handleWriteButtonClick = () => {
    if (project?.last_active_chapter_id) {
      goToWritingSpace(project.last_active_chapter_id);
    } else {
      goToWritingSpace();
    }
  };

  const getWriteButtonText = () => {
    if (project?.last_active_chapter_id) {
      return 'Continue Writing';
    }
    return chapters.length > 0 ? 'Start Writing' : 'Create First Chapter';
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

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
