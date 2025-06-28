import { supabase } from '@/integrations/supabase/client';
import { ProcessingJob, AnalysisStatus } from '@/types/knowledge';

export class ProcessingJobService {
  static async createJob(
    projectId: string,
    chapterId?: string,
    jobType: 'full_analysis' | 'incremental_update' | 'fact_extraction' = 'full_analysis'
  ): Promise<ProcessingJob> {
    console.log('📝 [DEBUG-JOB] Creating job:', { projectId, chapterId, jobType });
    
    const jobData = {
      project_id: projectId,
      chapter_id: chapterId,
      job_type: jobType,
      state: 'pending' as const,
      progress_percentage: 0,
      total_steps: 4, // thinking -> analyzing -> extracting -> done
      completed_steps: 0,
      processing_options: {},
      results_summary: {},
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('📝 [DEBUG-JOB] Job data prepared:', jobData);

    const { data, error } = await supabase
      .from('knowledge_processing_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('❌ [DEBUG-JOB] Failed to create job:', error);
      throw error;
    }
    
    console.log('✅ [DEBUG-JOB] Created processing job:', data.id);
    
    // Convert the database response to match our interface with proper type casting
    const processedJob = {
      ...data,
      job_type: data.job_type as ProcessingJob['job_type'],
      processing_options: typeof data.processing_options === 'string' 
        ? JSON.parse(data.processing_options) 
        : data.processing_options || {},
      results_summary: typeof data.results_summary === 'string' 
        ? JSON.parse(data.results_summary) 
        : data.results_summary || {},
      error_details: typeof data.error_details === 'string' 
        ? JSON.parse(data.error_details) 
        : data.error_details
    };

    console.log('📝 [DEBUG-JOB] Processed job object:', processedJob);
    return processedJob;
  }

  static async updateJobProgress(
    jobId: string,
    updates: {
      state?: ProcessingJob['state'];
      progress_percentage?: number;
      current_step?: string;
      completed_steps?: number;
      total_steps?: number;
      error_message?: string;
      error_details?: Record<string, any>;
      results_summary?: Record<string, any>;
    }
  ): Promise<void> {
    console.log(`📊 [DEBUG-JOB] Updating job ${jobId}:`, updates);

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

    if (error) {
      console.error(`❌ [DEBUG-JOB] Failed to update job ${jobId}:`, error);
      throw error;
    }
    console.log(`✅ [DEBUG-JOB] Updated processing job: ${jobId}`, updates);
  }

  static async cancelJob(jobId: string): Promise<void> {
    console.log(`🚫 Cancelling job ${jobId}`);
    
    try {
      await this.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Job cancelled by user',
        error_details: { 
          cancelled: true, 
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'user_action'
        }
      });
      console.log(`✅ Job ${jobId} cancelled successfully`);
    } catch (error) {
      console.error(`❌ Failed to cancel job ${jobId}:`, error);
      throw error;
    }
  }

  static async resetStuckJobs(projectId: string): Promise<number> {
    console.log(`🔄 Checking for stuck jobs in project ${projectId}`);
    
    try {
      // Find jobs that have been in pending/thinking/analyzing state for more than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: stuckJobs, error: fetchError } = await supabase
        .from('knowledge_processing_jobs')
        .select('id, job_type, state, started_at')
        .eq('project_id', projectId)
        .in('state', ['pending', 'thinking', 'analyzing', 'extracting'])
        .lt('started_at', fiveMinutesAgo);

      if (fetchError) {
        console.error('❌ Error fetching stuck jobs:', fetchError);
        throw fetchError;
      }

      if (stuckJobs && stuckJobs.length > 0) {
        console.log(`🔧 Found ${stuckJobs.length} stuck jobs, resetting...`, stuckJobs.map(j => ({ id: j.id, type: j.job_type, state: j.state })));
        
        const { error: updateError } = await supabase
          .from('knowledge_processing_jobs')
          .update({
            state: 'failed',
            error_message: 'Job timed out - exceeded processing time limit (5 minutes)',
            error_details: { 
              timeout: true, 
              reset_at: new Date().toISOString(),
              timeout_threshold: '5 minutes',
              original_state: stuckJobs[0]?.state
            },
            completed_at: new Date().toISOString()
          })
          .in('id', stuckJobs.map(job => job.id));

        if (updateError) {
          console.error('❌ Error resetting stuck jobs:', updateError);
          throw updateError;
        }
        
        console.log(`✅ Reset ${stuckJobs.length} stuck jobs successfully`);
        return stuckJobs.length;
      }
      
      console.log('✅ No stuck jobs found');
      return 0;
    } catch (error) {
      console.error(`❌ Error in resetStuckJobs for project ${projectId}:`, error);
      throw error;
    }
  }

  static async getProjectAnalysisStatus(projectId: string): Promise<AnalysisStatus> {
    console.log(`📊 [DEBUG-STATUS] Getting analysis status for project ${projectId}`);
    
    try {
      // Reset stuck jobs before checking status
      await this.resetStuckJobs(projectId);

      // Get latest processing job
      console.log(`🔍 [DEBUG-STATUS] Fetching latest job...`);
      const { data: latestJob, error: jobError } = await supabase
        .from('knowledge_processing_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (jobError && jobError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('❌ [DEBUG-STATUS] Error fetching latest job:', jobError);
      }

      console.log(`📋 [DEBUG-STATUS] Latest job:`, latestJob ? {
        id: latestJob.id,
        state: latestJob.state,
        progress: latestJob.progress_percentage,
        currentStep: latestJob.current_step,
        errorMessage: latestJob.error_message
      } : 'No job found');

      // Get error counts from knowledge base
      console.log(`🔍 [DEBUG-STATUS] Fetching knowledge facts...`);
      const { data: flaggedFacts, error: factsError } = await supabase
        .from('knowledge_base')
        .select('id, confidence_score, is_flagged')
        .eq('project_id', projectId);

      if (factsError) {
        console.error('❌ [DEBUG-STATUS] Error fetching analysis status:', factsError);
      }

      const errorCount = flaggedFacts?.filter(fact => fact.is_flagged).length || 0;
      const lowConfidenceFactsCount = flaggedFacts?.filter(fact => fact.confidence_score < 0.5).length || 0;

      console.log(`📊 [DEBUG-STATUS] Knowledge stats:`, {
        totalFacts: flaggedFacts?.length || 0,
        errorCount,
        lowConfidenceFactsCount
      });

      let currentJob: ProcessingJob | undefined;
      if (latestJob) {
        // Convert the database response to match our interface with proper type casting
        currentJob = {
          ...latestJob,
          job_type: latestJob.job_type as ProcessingJob['job_type'],
          processing_options: typeof latestJob.processing_options === 'string' 
            ? JSON.parse(latestJob.processing_options) 
            : latestJob.processing_options || {},
          results_summary: typeof latestJob.results_summary === 'string' 
            ? JSON.parse(latestJob.results_summary) 
            : latestJob.results_summary || {},
          error_details: typeof latestJob.error_details === 'string' 
            ? JSON.parse(latestJob.error_details) 
            : latestJob.error_details
        };
      }

      const status = {
        isProcessing: latestJob?.state === 'pending' || latestJob?.state === 'thinking' || 
                     latestJob?.state === 'analyzing' || latestJob?.state === 'extracting',
        hasErrors: latestJob?.state === 'failed' || errorCount > 0,
        lastProcessedAt: latestJob?.completed_at,
        currentJob,
        errorCount,
        lowConfidenceFactsCount
      };

      console.log(`📊 [DEBUG-STATUS] Final analysis status for project ${projectId}:`, {
        isProcessing: status.isProcessing,
        hasErrors: status.hasErrors,
        jobState: latestJob?.state,
        errorCount,
        lowConfidenceFactsCount,
        currentJobId: currentJob?.id
      });

      return status;
    } catch (error) {
      console.error(`❌ [DEBUG-STATUS] Error getting analysis status for project ${projectId}:`, error);
      // Return default status on error
      return {
        isProcessing: false,
        hasErrors: true,
        errorCount: 0,
        lowConfidenceFactsCount: 0
      };
    }
  }

  static async simulateAnalysisJob(jobId: string, chapterId?: string): Promise<void> {
    try {
      // Simulate thinking phase
      await this.updateJobProgress(jobId, {
        state: 'thinking',
        current_step: 'Analyzing chapter structure...',
        completed_steps: 1,
        progress_percentage: 25
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate analyzing phase
      await this.updateJobProgress(jobId, {
        state: 'analyzing',
        current_step: 'Extracting characters and relationships...',
        completed_steps: 2,
        progress_percentage: 50
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate extracting phase
      await this.updateJobProgress(jobId, {
        state: 'extracting',
        current_step: 'Processing plot points and themes...',
        completed_steps: 3,
        progress_percentage: 75
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete job
      await this.updateJobProgress(jobId, {
        state: 'done',
        current_step: 'Analysis complete',
        completed_steps: 4,
        progress_percentage: 100,
        results_summary: {
          characters_extracted: Math.floor(Math.random() * 5) + 1,
          plot_points_identified: Math.floor(Math.random() * 8) + 2,
          themes_discovered: Math.floor(Math.random() * 3) + 1,
          processing_time_seconds: 3.5
        }
      });
    } catch (error) {
      console.error('Analysis job failed:', error);
      await this.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Analysis failed due to processing error',
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  static async estimateProcessingTime(wordCount: number): Promise<number> {
    // Estimate processing time based on word count
    // Roughly 1-2 seconds per 100 words for analysis
    return Math.max(10, Math.ceil(wordCount / 100) * 1.5);
  }
}
