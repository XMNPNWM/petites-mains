import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Chapter {
  id: string;
  title: string;
  order_index: number;
  project_id: string;
}

export const useChapters = (projectId: string) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapters = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, order_index, project_id')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setChapters(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
      console.error('Error fetching chapters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return {
    chapters,
    isLoading,
    error,
    refresh: fetchChapters
  };
};