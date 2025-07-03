
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisJob {
  id: string;
  project_id: string;
  state: string;
  current_step: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

interface AnalysisStatus {
  isProcessing: boolean;
  lastProcessedAt: string | null;
  lowConfidenceFactsCount: number;
  errorCount: number;
  currentJob: AnalysisJob | null;
}

export const useJobManager = () => {
  const [analysisJobs, setAnalysisJobs] = useState<AnalysisJob[]>([]);

  const getProjectAnalysisStatus = useCallback(async (projectId: string): Promise<AnalysisStatus> => {
    try {
      // Get recent analysis jobs for this project - using correct table name
      const { data: jobs, error: jobsError } = await supabase
        .from('knowledge_processing_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) {
        console.error('Error fetching analysis jobs:', jobsError);
      }

      // Get knowledge base stats
      const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge_base')
        .select('confidence_score, is_flagged')
        .eq('project_id', projectId);

      if (knowledgeError) {
        console.error('Error fetching knowledge stats:', knowledgeError);
      }

      const currentJob = jobs?.[0] || null;
      const isProcessing = currentJob?.state === 'thinking' || currentJob?.state === 'analyzing' || currentJob?.state === 'extracting' || currentJob?.state === 'pending';
      const lastProcessedAt = jobs?.find(job => job.state === 'done')?.updated_at || null;

      const lowConfidenceFactsCount = knowledge?.filter(k => k.confidence_score < 0.7).length || 0;
      const errorCount = knowledge?.filter(k => k.is_flagged).length || 0;

      return {
        isProcessing,
        lastProcessedAt,
        lowConfidenceFactsCount,
        errorCount,
        currentJob
      };
    } catch (error) {
      console.error('Error getting project analysis status:', error);
      return {
        isProcessing: false,
        lastProcessedAt: null,
        lowConfidenceFactsCount: 0,
        errorCount: 0,
        currentJob: null
      };
    }
  }, []);

  const subscribeToProjectAnalysisStatus = useCallback((projectId: string, callback: (status: AnalysisStatus) => void) => {
    // Set up real-time subscription for analysis status updates
    const channel = supabase
      .channel(`analysis-status-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_processing_jobs',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          const status = await getProjectAnalysisStatus(projectId);
          callback(status);
        }
      )
      .subscribe();

    return channel;
  }, [getProjectAnalysisStatus]);

  const unsubscribeFromProjectAnalysisStatus = useCallback((channel: any) => {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  }, []);

  return {
    analysisJobs,
    getProjectAnalysisStatus,
    subscribeToProjectAnalysisStatus,
    unsubscribeFromProjectAnalysisStatus
  };
};
