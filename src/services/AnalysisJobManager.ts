
import { supabase } from '@/integrations/supabase/client';
import { ProcessingJob, AnalysisStatus } from '@/types/knowledge';

export class AnalysisJobManager {
  /**
   * Create a new analysis job
   */
  async createJob(
    projectId: string,
    jobType: 'full_analysis' | 'incremental_update' | 'fact_extraction' = 'full_analysis',
    chapterId?: string
  ): Promise<ProcessingJob> {
    console.log('📝 Creating analysis job:', { projectId, chapterId, jobType });
    
    const jobData = {
      project_id: projectId,
      chapter_id: chapterId,
      job_type: jobType,
      state: 'pending' as const,
      progress_percentage: 0,
      total_steps: 4,
      completed_steps: 0,
      processing_options: {},
      results_summary: {},
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('knowledge_processing_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      job_type: data.job_type as ProcessingJob['job_type'],
      processing_options: (data.processing_options as Record<string, any>) || {},
      results_summary: (data.results_summary as Record<string, any>) || {},
      error_details: data.error_details as Record<string, any> | undefined
    };
  }

  /**
   * Update job progress
   */
  async updateProgress(
    jobId: string,
    updates: {
      state?: ProcessingJob['state'];
      progress_percentage?: number;
      current_step?: string;
      completed_steps?: number;
      error_message?: string;
      error_details?: Record<string, any>;
      results_summary?: Record<string, any>;
    }
  ): Promise<void> {
    console.log(`📊 Updating job ${jobId}:`, updates);

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.state === 'done' || updates.state === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('knowledge_processing_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) throw error;
  }

  /**
   * Get project analysis status
   */
  async getProjectAnalysisStatus(projectId: string): Promise<AnalysisStatus> {
    try {
      // Get latest job
      const { data: latestJob } = await supabase
        .from('knowledge_processing_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get error counts
      const { data: flaggedFacts } = await supabase
        .from('knowledge_base')
        .select('id, confidence_score, is_flagged')
        .eq('project_id', projectId);

      const errorCount = flaggedFacts?.filter(fact => fact.is_flagged).length || 0;
      const lowConfidenceFactsCount = flaggedFacts?.filter(fact => fact.confidence_score < 0.5).length || 0;

      let currentJob: ProcessingJob | undefined;
      if (latestJob) {
        currentJob = {
          ...latestJob,
          job_type: latestJob.job_type as ProcessingJob['job_type'],
          processing_options: (latestJob.processing_options as Record<string, any>) || {},
          results_summary: (latestJob.results_summary as Record<string, any>) || {},
          error_details: latestJob.error_details as Record<string, any> | undefined
        };
      }

      return {
        isProcessing: latestJob?.state === 'pending' || latestJob?.state === 'thinking' || 
                     latestJob?.state === 'analyzing' || latestJob?.state === 'extracting',
        hasErrors: latestJob?.state === 'failed' || errorCount > 0,
        lastProcessedAt: latestJob?.completed_at,
        currentJob,
        errorCount,
        lowConfidenceFactsCount
      };
    } catch (error) {
      console.error('Error getting analysis status:', error);
      return {
        isProcessing: false,
        hasErrors: true,
        errorCount: 0,
        lowConfidenceFactsCount: 0
      };
    }
  }

  /**
   * Cancel running job
   */
  async cancelJob(jobId: string): Promise<void> {
    await this.updateProgress(jobId, {
      state: 'failed',
      error_message: 'Job cancelled by user',
      error_details: { 
        cancelled: true, 
        cancelled_at: new Date().toISOString() 
      }
    });
  }
}
