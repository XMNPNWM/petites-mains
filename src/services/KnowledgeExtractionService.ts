
import { supabase } from '@/integrations/supabase/client';
import { ContentHashService } from './ContentHashService';
import { ProcessingJobService } from './ProcessingJobService';
import { KnowledgeBase } from '@/types/knowledge';

export class KnowledgeExtractionService {
  static async extractKnowledgeFromChapter(
    projectId: string,
    chapterId: string,
    content: string,
    triggerContext: 'chat' | 'enhancement' | 'manual'
  ): Promise<{ jobId: string; needsAnalysis: boolean }> {
    console.log('Starting knowledge extraction for chapter:', chapterId, 'context:', triggerContext);

    // Verify content hash to check if analysis is needed
    const verification = await ContentHashService.verifyContentHash(chapterId, content);
    
    if (!verification.needsReanalysis) {
      console.log('Chapter content unchanged, skipping analysis');
      return { jobId: '', needsAnalysis: false };
    }

    // Update content hash
    await ContentHashService.updateContentHash(chapterId, content);

    // Create processing job
    const job = await ProcessingJobService.createJob(projectId, chapterId, 'fact_extraction');

    // Start analysis in background (simulated for now)
    this.performAnalysis(job.id, projectId, chapterId, content);

    return { jobId: job.id, needsAnalysis: true };
  }

  static async extractKnowledgeFromProject(projectId: string): Promise<{ jobId: string }> {
    console.log('Starting full project knowledge extraction:', projectId);

    // Get all chapters for the project
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) throw error;

    // Create processing job for full analysis
    const job = await ProcessingJobService.createJob(projectId, undefined, 'full_analysis');

    // Start analysis in background
    this.performFullProjectAnalysis(job.id, projectId, chapters || []);

    return { jobId: job.id };
  }

  private static async performAnalysis(
    jobId: string,
    projectId: string,
    chapterId: string,
    content: string
  ): Promise<void> {
    try {
      // Simulate the analysis process
      await ProcessingJobService.simulateAnalysisJob(jobId, chapterId);

      // Create some sample knowledge entries (this would be replaced with actual AI extraction)
      await this.createSampleKnowledgeEntries(projectId, chapterId);

      // Mark content as processed
      await ContentHashService.markAsProcessed(chapterId);

      console.log('Chapter analysis completed:', chapterId);
    } catch (error) {
      console.error('Analysis failed:', error);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Knowledge extraction failed',
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private static async performFullProjectAnalysis(
    jobId: string,
    projectId: string,
    chapters: any[]
  ): Promise<void> {
    try {
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'thinking',
        current_step: `Analyzing ${chapters.length} chapters...`,
        total_steps: chapters.length + 1,
        completed_steps: 0
      });

      // Process each chapter
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        await ProcessingJobService.updateJobProgress(jobId, {
          state: 'analyzing',
          current_step: `Processing "${chapter.title}"...`,
          completed_steps: i + 1,
          progress_percentage: Math.round(((i + 1) / (chapters.length + 1)) * 100)
        });

        // Simulate chapter processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (chapter.content) {
          await this.createSampleKnowledgeEntries(projectId, chapter.id);
          await ContentHashService.updateContentHash(chapter.id, chapter.content);
        }
      }

      // Complete the job
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'done',
        current_step: 'Analysis complete',
        completed_steps: chapters.length + 1,
        progress_percentage: 100,
        results_summary: {
          chapters_processed: chapters.length,
          total_facts_extracted: chapters.length * 3 // Simulated
        }
      });

      console.log('Full project analysis completed:', projectId);
    } catch (error) {
      console.error('Full project analysis failed:', error);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Full project analysis failed',
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private static async createSampleKnowledgeEntries(
    projectId: string,
    chapterId: string
  ): Promise<void> {
    // Create sample knowledge entries (this would be replaced with actual AI extraction)
    const sampleEntries = [
      {
        project_id: projectId,
        source_chapter_id: chapterId,
        name: 'Main Character',
        category: 'character' as const,
        description: 'Protagonist of the story with mysterious background',
        confidence_score: 0.85,
        extraction_method: 'llm_direct' as const,
        evidence: 'Referenced multiple times throughout the chapter',
        details: { role: 'protagonist', traits: ['mysterious', 'determined'] }
      },
      {
        project_id: projectId,
        source_chapter_id: chapterId,
        name: 'Central Conflict',
        category: 'plot_point' as const,
        description: 'Key story tension driving the narrative forward',
        confidence_score: 0.72,
        extraction_method: 'llm_inferred' as const,
        evidence: 'Implied through character actions and dialogue',
        details: { type: 'internal_conflict', intensity: 'high' }
      }
    ];

    for (const entry of sampleEntries) {
      const { error } = await supabase
        .from('knowledge_base')
        .insert(entry);

      if (error) {
        console.error('Failed to create sample knowledge entry:', error);
      }
    }
  }

  static async getProjectKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFlaggedKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_flagged', true)
      .order('confidence_score', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
