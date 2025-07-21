
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingJob, AnalysisStatus } from '@/types/knowledge';

export const useJobManager = () => {
  const [analysisJobs, setAnalysisJobs] = useState<ProcessingJob[]>([]);

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

      // Check for unanalyzed content by comparing chapters with content hashes
      const { data: chaptersAnalysisStatus, error: chaptersError } = await supabase
        .from('chapters')
        .select(`
          id,
          title,
          updated_at,
          content
        `)
        .eq('project_id', projectId);

      if (chaptersError) {
        console.error('Error fetching chapters analysis status:', chaptersError);
      }

      // Get content hashes for all chapters in this project
      const { data: contentHashes, error: hashesError } = await supabase
        .from('content_hashes')
        .select('chapter_id, last_processed_at')
        .in('chapter_id', chaptersAnalysisStatus?.map(c => c.id) || []);

      if (hashesError) {
        console.error('Error fetching content hashes:', hashesError);
      }

      // Create a map for quick lookup of content hashes by chapter_id
      const hashesMap = new Map();
      contentHashes?.forEach(hash => {
        hashesMap.set(hash.chapter_id, hash.last_processed_at);
      });

      // Analyze which chapters need processing
      let unanalyzedChapterCount = 0;
      if (chaptersAnalysisStatus) {
        for (const chapter of chaptersAnalysisStatus) {
          // Skip chapters with no content
          if (!chapter.content || chapter.content.trim().length === 0) {
            continue;
          }

          // Check if chapter has never been analyzed
          const lastProcessed = hashesMap.get(chapter.id);
          if (!lastProcessed) {
            unanalyzedChapterCount++;
            console.log(`Unanalyzed chapter found: ${chapter.title} - no content hash record`);
            continue;
          }

          // Check if chapter content is newer than last analysis
          if (chapter.updated_at) {
            const chapterUpdateTime = new Date(chapter.updated_at);
            const lastProcessedTime = new Date(lastProcessed);
            
            if (chapterUpdateTime > lastProcessedTime) {
              unanalyzedChapterCount++;
              console.log(`Outdated analysis for chapter: ${chapter.title} - content newer than analysis`);
            }
          }
        }
      }

      const currentJob = jobs?.[0] ? {
        ...jobs[0],
        job_type: jobs[0].job_type as ProcessingJob['job_type'],
        state: jobs[0].state as ProcessingJob['state'],
        processing_options: (jobs[0].processing_options as Record<string, any>) || {},
        results_summary: (jobs[0].results_summary as Record<string, any>) || {},
        error_details: jobs[0].error_details as Record<string, any> | undefined
      } as ProcessingJob : null;

      const isProcessing = currentJob?.state === 'thinking' || currentJob?.state === 'analyzing' || currentJob?.state === 'extracting' || currentJob?.state === 'pending';
      const lastProcessedAt = jobs?.find(job => job.state === 'done')?.updated_at || null;

      const lowConfidenceFactsCount = knowledge?.filter(k => k.confidence_score < 0.7).length || 0;
      const errorCount = knowledge?.filter(k => k.is_flagged).length || 0;
      const hasErrors = errorCount > 0;
      const hasUnanalyzedContent = unanalyzedChapterCount > 0;

      return {
        isProcessing,
        lastProcessedAt,
        lowConfidenceFactsCount,
        errorCount,
        hasErrors,
        hasUnanalyzedContent,
        unanalyzedChapterCount,
        currentJob
      };
    } catch (error) {
      console.error('Error getting project analysis status:', error);
      return {
        isProcessing: false,
        lastProcessedAt: null,
        lowConfidenceFactsCount: 0,
        errorCount: 0,
        hasErrors: false,
        hasUnanalyzedContent: false,
        unanalyzedChapterCount: 0,
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          const status = await getProjectAnalysisStatus(projectId);
          callback(status);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_hashes'
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
