
import { supabase } from '@/integrations/supabase/client';
import { ProcessingJob, AnalysisStatus } from '@/types/knowledge';

export class ProcessingJobService {
  static async createJob(
    projectId: string,
    chapterId?: string,
    jobType: 'full_analysis' | 'incremental_update' | 'fact_extraction' = 'full_analysis'
  ): Promise<ProcessingJob> {
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

    const { data, error } = await supabase
      .from('knowledge_processing_jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) throw error;
    console.log('Created processing job:', data.id);
    
    // Convert the database response to match our interface with proper type casting
    return {
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
    console.log('Updated processing job:', jobId, updates);
  }

  static async getProjectAnalysisStatus(projectId: string): Promise<AnalysisStatus> {
    // Get latest processing job
    const { data: latestJob } = await supabase
      .from('knowledge_processing_jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get error counts from knowledge base
    const { data: flaggedFacts, error } = await supabase
      .from('knowledge_base')
      .select('id, confidence_score, is_flagged')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching analysis status:', error);
    }

    const errorCount = flaggedFacts?.filter(fact => fact.is_flagged).length || 0;
    const lowConfidenceFactsCount = flaggedFacts?.filter(fact => fact.confidence_score < 0.5).length || 0;

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

    return {
      isProcessing: latestJob?.state === 'pending' || latestJob?.state === 'thinking' || 
                   latestJob?.state === 'analyzing' || latestJob?.state === 'extracting',
      hasErrors: latestJob?.state === 'failed' || errorCount > 0,
      lastProcessedAt: latestJob?.completed_at,
      currentJob,
      errorCount,
      lowConfidenceFactsCount
    };
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
}
