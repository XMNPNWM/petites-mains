import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/Project';
import { Chapter } from '@/types/Chapter';
import { ReadOnlyStorylineViewer } from '@/components/panels/storyline/ReadOnlyStorylineViewer';
import { ChapterOrganizerPanel } from '@/components/panels/chapters/ChapterOrganizerPanel';
import { ProjectInsights } from '@/components/panels/analytics/ProjectInsights';
import { UnifiedWorldbuildingPanel } from '@/components/panels/worldbuilding/UnifiedWorldbuildingPanel';
import { EnhancedAIBrainPanel } from '@/components/panels/ai-brain/EnhancedAIBrainPanel';

interface Panel {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  props: any;
}

export const useProjectDashboard = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          throw new Error(`Failed to fetch project: ${projectError.message}`);
        }

        if (!projectData) {
          throw new Error('Project not found');
        }

        setProject(projectData as Project);

        // Fetch chapters for the project
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('project_id', projectId)
          .order('order_number', { ascending: true });

        if (chaptersError) {
          throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
        }

        setChapters(chaptersData as Chapter[]);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching project data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const panels = [
    { 
      id: 'storyline', 
      label: 'Storyline', 
      component: ReadOnlyStorylineViewer,
      props: { projectId }
    },
    { 
      id: 'worldbuilding', 
      label: 'World Elements', 
      component: UnifiedWorldbuildingPanel,
      props: { projectId }
    },
    { 
      id: 'ai-brain', 
      label: 'AI Brain', 
      component: EnhancedAIBrainPanel,
      props: { projectId }
    },
    { 
      id: 'chapters', 
      label: 'Chapters', 
      component: ChapterOrganizerPanel,
      props: { projectId }
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      component: ProjectInsights,
      props: { projectId }
    }
  ];

  return {
    project,
    chapters,
    isLoading,
    error,
    panels
  };
};
