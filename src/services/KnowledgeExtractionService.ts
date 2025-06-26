import { supabase } from '@/integrations/supabase/client';
import { ContentHashService } from './ContentHashService';
import { ProcessingJobService } from './ProcessingJobService';
import { SemanticChunkingService } from './SemanticChunkingService';
import { AIIntelligenceService } from './AIIntelligenceService';
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

  static async extractKnowledgeFromChapterWithChunking(
    projectId: string,
    chapterId: string,
    content: string,
    triggerContext: 'chat' | 'enhancement' | 'manual'
  ): Promise<{ jobId: string; needsAnalysis: boolean; chunksCreated: number }> {
    console.log('Starting enhanced knowledge extraction with chunking for chapter:', chapterId);

    // Verify content hash to check if analysis is needed
    const verification = await ContentHashService.verifyContentHash(chapterId, content);
    
    if (!verification.needsReanalysis) {
      console.log('Chapter content unchanged, checking existing chunks...');
      const existingChunks = await SemanticChunkingService.getChunksForChapter(chapterId);
      return { jobId: '', needsAnalysis: false, chunksCreated: existingChunks.length };
    }

    // Perform semantic chunking
    const chunkingResult = await SemanticChunkingService.processChapter(chapterId, content);
    console.log(`Created ${chunkingResult.total_chunks} semantic chunks`);

    // Update content hash
    await ContentHashService.updateContentHash(chapterId, content);

    // Create processing job for AI extraction from chunks
    const job = await ProcessingJobService.createJob(projectId, chapterId, 'fact_extraction');

    // Start enhanced analysis in background
    this.performEnhancedAnalysis(job.id, projectId, chapterId, chunkingResult.chunks);

    return { 
      jobId: job.id, 
      needsAnalysis: true, 
      chunksCreated: chunkingResult.total_chunks 
    };
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

  private static async performEnhancedAnalysis(
    jobId: string,
    projectId: string,
    chapterId: string,
    chunks: any[]
  ): Promise<void> {
    try {
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'analyzing',
        current_step: `Analyzing ${chunks.length} semantic chunks...`,
        total_steps: chunks.length + 2,
        completed_steps: 0
      });

      // Analyze each chunk for knowledge extraction
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        await ProcessingJobService.updateJobProgress(jobId, {
          state: 'extracting',
          current_step: `Extracting knowledge from chunk ${i + 1}/${chunks.length}...`,
          completed_steps: i + 1
        });

        // Extract knowledge from this chunk
        await this.extractKnowledgeFromChunk(projectId, chapterId, chunk);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Build relationships and connections
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'analyzing',
        current_step: 'Building character relationships and plot connections...',
        completed_steps: chunks.length + 1
      });

      await this.buildRelationshipsAndConnections(projectId, chapterId);

      // Complete the job
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'done',
        current_step: 'Enhanced analysis complete',
        completed_steps: chunks.length + 2,
        progress_percentage: 100,
        results_summary: {
          chunks_processed: chunks.length,
          relationships_analyzed: true,
          knowledge_enhanced: true
        }
      });

      console.log('Enhanced analysis completed for chapter:', chapterId);
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Enhanced knowledge extraction failed',
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private static async extractKnowledgeFromChunk(
    projectId: string,
    chapterId: string,
    chunk: any
  ): Promise<void> {
    // For now, create sample knowledge entries based on chunk analysis
    // This will be replaced with actual AI processing in Sub-Phase 1D.3
    
    if (chunk.dialogue_present && chunk.dialogue_speakers.length > 0) {
      // Create character entries for speakers
      for (const speaker of chunk.dialogue_speakers) {
        await this.createOrUpdateCharacterKnowledge(projectId, chapterId, speaker, chunk);
      }
    }

    // Analyze discourse markers for plot events
    if (chunk.discourse_markers.length > 0) {
      await this.createPlotEventKnowledge(projectId, chapterId, chunk);
    }
  }

  private static async createOrUpdateCharacterKnowledge(
    projectId: string,
    chapterId: string,
    characterName: string,
    chunk: any
  ): Promise<void> {
    // Check if character already exists
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', 'character')
      .eq('name', characterName)
      .single();

    if (existing) {
      // Update last appearance
      await supabase
        .from('knowledge_base')
        .update({
          last_appearance_chapter_id: chapterId,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new character entry
      await supabase
        .from('knowledge_base')
        .insert({
          project_id: projectId,
          source_chapter_id: chapterId,
          first_appearance_chapter_id: chapterId,
          last_appearance_chapter_id: chapterId,
          name: characterName,
          category: 'character',
          description: `Character identified in chapter through dialogue`,
          confidence_score: 0.75,
          extraction_method: 'llm_inferred',
          evidence: `Found in semantic chunk ${chunk.chunk_index}`,
          details: {
            first_appearance_context: chunk.content.substring(0, 200),
            dialogue_patterns: ['speaks_in_chapter']
          }
        });
    }
  }

  private static async createPlotEventKnowledge(
    projectId: string,
    chapterId: string,
    chunk: any
  ): Promise<void> {
    // Create plot event based on discourse markers
    const eventDescription = `Plot event identified by discourse markers: ${
      chunk.discourse_markers.map((m: any) => m.text).join(', ')
    }`;

    await supabase
      .from('knowledge_base')
      .insert({
        project_id: projectId,
        source_chapter_id: chapterId,
        name: `Event in Chunk ${chunk.chunk_index}`,
        category: 'event',
        description: eventDescription,
        confidence_score: 0.65,
        extraction_method: 'llm_inferred',
        evidence: `Discourse markers detected: ${JSON.stringify(chunk.discourse_markers)}`,
        details: {
          chunk_context: chunk.content.substring(0, 300),
          discourse_markers: chunk.discourse_markers
        }
      });
  }

  private static async buildRelationshipsAndConnections(
    projectId: string,
    chapterId: string
  ): Promise<void> {
    // Get characters from this chapter
    const { data: chapterCharacters } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('category', 'character')
      .or(`source_chapter_id.eq.${chapterId},last_appearance_chapter_id.eq.${chapterId}`);

    if (!chapterCharacters || chapterCharacters.length < 2) return;

    // Create basic relationships between characters who appear in the same chapter
    for (let i = 0; i < chapterCharacters.length; i++) {
      for (let j = i + 1; j < chapterCharacters.length; j++) {
        const charA = chapterCharacters[i];
        const charB = chapterCharacters[j];

        // Check if relationship already exists
        const { data: existingRelation } = await supabase
          .from('character_relationships' as any)
          .select('*')
          .eq('project_id', projectId)
          .or(`and(character_a_name.eq.${charA.name},character_b_name.eq.${charB.name}),and(character_a_name.eq.${charB.name},character_b_name.eq.${charA.name})`)
          .single();

        if (!existingRelation) {
          // Create new relationship
          await AIIntelligenceService.createCharacterRelationship({
            project_id: projectId,
            character_a_id: charA.id,
            character_b_id: charB.id,
            character_a_name: charA.name,
            character_b_name: charB.name,
            relationship_type: 'co_occurrence',
            relationship_strength: 3, // Base strength for co-occurrence
            strength_history: [
              {
                chapter_id: chapterId,
                strength: 3,
                timestamp: new Date().toISOString(),
                change_reason: 'Characters appear in same chapter'
              }
            ],
            key_interactions: [],
            relationship_start_chapter_id: chapterId,
            relationship_current_status: 'active',
            confidence_score: 0.60,
            extraction_method: 'llm_inferred',
            evidence: `Both characters appear in chapter ${chapterId}`,
            is_flagged: false,
            is_verified: false
          });
        }
      }
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
        details: { role: 'protagonist', traits: ['mysterious', 'determined'] },
        is_flagged: false,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
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
        details: { type: 'internal_conflict', intensity: 'high' },
        is_flagged: false,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
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
    
    // Convert the database response to match our interface
    return (data || []).map(item => ({
      ...item,
      details: typeof item.details === 'string' 
        ? JSON.parse(item.details) 
        : item.details || {}
    }));
  }

  static async getFlaggedKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_flagged', true)
      .order('confidence_score', { ascending: true });

    if (error) throw error;
    
    // Convert the database response to match our interface
    return (data || []).map(item => ({
      ...item,
      details: typeof item.details === 'string' 
        ? JSON.parse(item.details) 
        : item.details || {}
    }));
  }
}
