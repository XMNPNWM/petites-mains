
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, Chapter } from '@/types/shared';

export const useProjectData = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, user_id')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [projectId]);

  const fetchChapters = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const refreshChapters = useCallback(() => {
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    if (projectId) {
      setIsLoading(true);
      fetchProject();
      fetchChapters();
    }
  }, [projectId, fetchProject, fetchChapters]);

  return {
    project,
    chapters,
    isLoading,
    refreshChapters,
    fetchProject,
    fetchChapters
  };
};
