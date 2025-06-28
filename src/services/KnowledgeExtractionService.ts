import { supabase } from '@/integrations/supabase/client';
import { ContentHashService } from './ContentHashService';
import { ProcessingJobService } from './ProcessingJobService';
import { SemanticChunkingService } from './SemanticChunkingService';
import { AIIntelligenceService } from './AIIntelligenceService';
import { GoogleAIService } from './GoogleAIService';
import { KnowledgeBase } from '@/types/knowledge';

export class KnowledgeExtractionService {
  static async extractKnowledgeFromChapter(
    projectId: string,
    chapterId: string,
    content: string,
    triggerContext: 'chat' | 'enhancement' | 'manual'
  ): Promise<{ jobId: string; needsAnalysis: boolean }> {
    console.log('🔄 Starting knowledge extraction for chapter:', chapterId, 'context:', triggerContext);

    try {
      // Reset any stuck jobs first
      const resetCount = await ProcessingJobService.resetStuckJobs(projectId);
      if (resetCount > 0) {
        console.log(`✅ Reset ${resetCount} stuck jobs before starting new analysis`);
      }

      // Verify content hash to check if analysis is needed
      const verification = await ContentHashService.verifyContentHash(chapterId, content);
      
      if (!verification.needsReanalysis) {
        console.log('⏭️ Chapter content unchanged, skipping analysis');
        return { jobId: '', needsAnalysis: false };
      }

      // Update content hash
      await ContentHashService.updateContentHash(chapterId, content);

      // Create processing job
      const job = await ProcessingJobService.createJob(projectId, chapterId, 'fact_extraction');
      console.log(`📝 Created processing job: ${job.id}`);

      // Start analysis with proper error handling - AWAIT THE BACKGROUND PROCESS
      try {
        await this.performAnalysisWithGoogleAI(job.id, projectId, chapterId, content);
        console.log(`✅ Chapter analysis completed successfully: ${chapterId}`);
      } catch (error) {
        console.error('❌ Background analysis failed:', error);
        await ProcessingJobService.updateJobProgress(job.id, {
          state: 'failed',
          error_message: `Background analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error_details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            trigger_context: triggerContext
          }
        });
        throw error; // Re-throw to let caller handle
      }

      return { jobId: job.id, needsAnalysis: true };
    } catch (error) {
      console.error('❌ Knowledge extraction setup failed:', error);
      throw error;
    }
  }

  static async extractKnowledgeFromProject(projectId: string): Promise<{ jobId: string }> {
    console.log('🚀 Starting full project knowledge extraction with Google AI:', projectId);

    try {
      // Reset any stuck jobs first
      const resetCount = await ProcessingJobService.resetStuckJobs(projectId);
      if (resetCount > 0) {
        console.log(`✅ Reset ${resetCount} stuck jobs before starting new analysis`);
      }

      // Get all chapters for the project
      const { data: chapters, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;

      if (!chapters || chapters.length === 0) {
        throw new Error('No chapters found for this project');
      }

      // Calculate estimated processing time
      const totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
      const estimatedTime = await ProcessingJobService.estimateProcessingTime(totalWordCount);
      
      console.log(`📊 Processing ${chapters.length} chapters with ${totalWordCount} total words. Estimated time: ${estimatedTime} seconds`);

      // Create processing job for full analysis
      const job = await ProcessingJobService.createJob(projectId, undefined, 'full_analysis');
      console.log(`📝 Created full project analysis job: ${job.id}`);

      // Start analysis with proper error handling - PROPERLY AWAIT THE BACKGROUND PROCESS
      try {
        await this.performFullProjectAnalysisWithGoogleAI(job.id, projectId, chapters || [], estimatedTime);
        console.log(`✅ Full project analysis completed successfully: ${projectId}`);
      } catch (error) {
        console.error('❌ Background full project analysis failed:', error);
        await ProcessingJobService.updateJobProgress(job.id, {
          state: 'failed',
          error_message: `Full project analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error_details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
            chapters_count: chapters.length,
            total_word_count: totalWordCount
          }
        });
        throw error; // Re-throw to let caller handle
      }

      return { jobId: job.id };
    } catch (error) {
      console.error('❌ Full project analysis setup failed:', error);
      throw error;
    }
  }

  static async extractKnowledgeFromChapterWithChunking(
    projectId: string,
    chapterId: string,
    content: string,
    triggerContext: 'chat' | 'enhancement' | 'manual'
  ): Promise<{ jobId: string; needsAnalysis: boolean; chunksCreated: number }> {
    console.log('Starting enhanced knowledge extraction with chunking and Google AI for chapter:', chapterId);

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

    // Start enhanced analysis in background using Google AI with proper error handling
    this.performEnhancedAnalysisWithGoogleAI(job.id, projectId, chapterId, chunkingResult.chunks)
      .catch(error => {
        console.error('Background enhanced analysis failed:', error);
        ProcessingJobService.updateJobProgress(job.id, {
          state: 'failed',
          error_message: 'Enhanced analysis failed',
          error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      });

    return { 
      jobId: job.id, 
      needsAnalysis: true, 
      chunksCreated: chunkingResult.total_chunks 
    };
  }

  private static async performAnalysisWithGoogleAI(
    jobId: string,
    projectId: string,
    chapterId: string,
    content: string
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`🎯 Starting Google AI analysis for job ${jobId}, chapter ${chapterId}`);
    
    // Set up timeout with proper cleanup
    const timeoutId = setTimeout(async () => {
      console.warn(`⏰ Analysis job ${jobId} timed out after 10 minutes`);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Analysis timed out after 10 minutes',
        error_details: { 
          timeout: true, 
          timeout_duration: '10 minutes',
          processing_time_ms: Date.now() - startTime
        }
      });
    }, 10 * 60 * 1000); // 10 minute timeout

    try {
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'thinking',
        current_step: 'Initializing Google AI analysis...',
        progress_percentage: 10
      });
      console.log(`🤔 Job ${jobId}: Thinking phase started`);

      // Validate Google AI service before proceeding
      try {
        await GoogleAIService.generateChatResponse([
          { role: 'user', content: 'Test connection' }
        ]);
        console.log(`✅ Google AI service validated for job ${jobId}`);
      } catch (validationError) {
        console.error(`❌ Google AI service validation failed for job ${jobId}:`, validationError);
        throw new Error(`Google AI service unavailable: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
      }

      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'analyzing',
        current_step: 'Extracting knowledge with Google AI...',
        progress_percentage: 25
      });
      console.log(`🔍 Job ${jobId}: Analysis phase started`);

      // Use Google AI for knowledge extraction with retry logic
      let extractedData;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          extractedData = await GoogleAIService.extractKnowledge(
            content,
            'comprehensive'
          );
          console.log(`✅ Job ${jobId}: Knowledge extracted successfully on attempt ${retryCount + 1}`);
          break;
        } catch (extractionError) {
          retryCount++;
          console.warn(`⚠️ Job ${jobId}: Extraction attempt ${retryCount} failed:`, extractionError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Knowledge extraction failed after ${maxRetries} attempts: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`);
          }
          
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ Job ${jobId}: Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'extracting',
        current_step: 'Storing extracted knowledge...',
        progress_percentage: 75
      });
      console.log(`💾 Job ${jobId}: Storage phase started`);

      // Store the extracted knowledge
      await this.storeExtractedKnowledgeFromGoogleAI(extractedData, projectId, chapterId);
      console.log(`✅ Job ${jobId}: Knowledge stored successfully`);

      // Mark content as processed
      await ContentHashService.markAsProcessed(chapterId);

      clearTimeout(timeoutId);
      
      const processingTime = Date.now() - startTime;
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'done',
        current_step: 'Knowledge extraction complete',
        progress_percentage: 100,
        results_summary: {
          extraction_method: 'google_ai',
          knowledge_extracted: true,
          characters_count: extractedData.characters?.length || 0,
          relationships_count: extractedData.relationships?.length || 0,
          plot_threads_count: extractedData.plotThreads?.length || 0,
          timeline_events_count: extractedData.timelineEvents?.length || 0,
          processing_time_ms: processingTime,
          retry_count: retryCount
        }
      });

      console.log(`🎉 Chapter analysis with Google AI completed: ${chapterId} (${processingTime}ms)`);
    } catch (error) {
      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      console.error(`❌ Google AI analysis failed for job ${jobId}:`, error);
      
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: `Knowledge extraction with Google AI failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error_details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTime,
          chapter_id: chapterId
        }
      });
      throw error;
    }
  }

  private static async performFullProjectAnalysisWithGoogleAI(
    jobId: string,
    projectId: string,
    chapters: any[],
    estimatedTimeSeconds: number
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`🚀 Starting full project Google AI analysis for job ${jobId}, ${chapters.length} chapters`);
    
    // Set up timeout with proper cleanup
    const timeoutId = setTimeout(async () => {
      console.warn(`⏰ Full project analysis job ${jobId} timed out after 20 minutes`);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Full project analysis timed out after 20 minutes',
        error_details: { 
          timeout: true, 
          timeout_duration: '20 minutes',
          processing_time_ms: Date.now() - startTime
        }
      });
    }, 20 * 60 * 1000); // 20 minute timeout for full project

    try {
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'thinking',
        current_step: `Initializing analysis of ${chapters.length} chapters (estimated ${Math.round(estimatedTimeSeconds / 60)} minutes)...`,
        total_steps: chapters.length + 1,
        completed_steps: 0,
        progress_percentage: 5
      });
      console.log(`🤔 Job ${jobId}: Full project thinking phase started`);

      // Validate Google AI service before proceeding
      try {
        await GoogleAIService.generateChatResponse([
          { role: 'user', content: 'Test connection' }
        ]);
        console.log(`✅ Google AI service validated for full project job ${jobId}`);
      } catch (validationError) {
        console.error(`❌ Google AI service validation failed for job ${jobId}:`, validationError);
        throw new Error(`Google AI service unavailable: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
      }

      let totalCharacters = 0;
      let totalRelationships = 0;
      let totalPlotThreads = 0;
      let totalTimelineEvents = 0;
      let processedChapters = 0;
      let skippedChapters = 0;

      // Process each chapter using Google AI
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const progressPercent = Math.round(((i + 1) / (chapters.length + 1)) * 90) + 5;
        
        await ProcessingJobService.updateJobProgress(jobId, {
          state: 'analyzing',
          current_step: `Processing chapter ${i + 1}/${chapters.length}: "${chapter.title}" (${chapter.word_count || 0} words)...`,
          completed_steps: i + 1,
          progress_percentage: progressPercent
        });
        console.log(`🔍 Job ${jobId}: Processing chapter ${i + 1}: ${chapter.title}`);

        if (chapter.content && chapter.content.trim()) {
          try {
            // Use Google AI for extraction with retry logic
            let extractedData;
            let retryCount = 0;
            const maxRetries = 2; // Fewer retries for full project to avoid timeouts

            while (retryCount < maxRetries) {
              try {
                extractedData = await GoogleAIService.extractKnowledge(
                  chapter.content,
                  'comprehensive'
                );
                console.log(`✅ Job ${jobId}: Chapter ${i + 1} extracted successfully on attempt ${retryCount + 1}`);
                break;
              } catch (extractionError) {
                retryCount++;
                console.warn(`⚠️ Job ${jobId}: Chapter ${i + 1} extraction attempt ${retryCount} failed:`, extractionError);
                
                if (retryCount >= maxRetries) {
                  console.error(`❌ Job ${jobId}: Chapter ${i + 1} extraction failed after ${maxRetries} attempts, skipping`);
                  extractedData = { characters: [], relationships: [], plotThreads: [], timelineEvents: [] };
                  break;
                }
                
                // Shorter delay for full project processing
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            await this.storeExtractedKnowledgeFromGoogleAI(extractedData, projectId, chapter.id);
            await ContentHashService.updateContentHash(chapter.id, chapter.content);
            
            // Track totals for summary
            totalCharacters += extractedData.characters?.length || 0;
            totalRelationships += extractedData.relationships?.length || 0;
            totalPlotThreads += extractedData.plotThreads?.length || 0;
            totalTimelineEvents += extractedData.timelineEvents?.length || 0;
            processedChapters++;
            
            console.log(`✅ Job ${jobId}: Chapter ${i + 1} completed (${extractedData.characters?.length || 0} chars, ${extractedData.relationships?.length || 0} rels)`);
          } catch (chapterError) {
            console.error(`❌ Job ${jobId}: Chapter ${i + 1} failed completely:`, chapterError);
            skippedChapters++;
          }
        } else {
          console.log(`⏭️ Job ${jobId}: Skipping chapter ${i + 1}: ${chapter.title} (no content)`);
          skippedChapters++;
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;

      // Complete the job
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'done',
        current_step: 'Full project Google AI analysis complete',
        completed_steps: chapters.length + 1,
        progress_percentage: 100,
        results_summary: {
          chapters_total: chapters.length,
          chapters_processed: processedChapters,
          chapters_skipped: skippedChapters,
          extraction_method: 'google_ai',
          characters_extracted: totalCharacters,
          relationships_extracted: totalRelationships,
          plot_threads_extracted: totalPlotThreads,
          timeline_events_extracted: totalTimelineEvents,
          processing_duration_ms: processingTime,
          processing_duration_minutes: Math.round(processingTime / 60000)
        }
      });

      console.log(`🎉 Full project analysis with Google AI completed: ${projectId} (${processingTime}ms, ${processedChapters}/${chapters.length} chapters processed)`);
    } catch (error) {
      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      console.error(`❌ Full project Google AI analysis failed for job ${jobId}:`, error);
      
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: `Full project Google AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error_details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          processing_time_ms: processingTime,
          chapters_count: chapters.length
        }
      });
      throw error;
    }
  }

  private static async performEnhancedAnalysisWithGoogleAI(
    jobId: string,
    projectId: string,
    chapterId: string,
    chunks: any[]
  ): Promise<void> {
    try {
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'analyzing',
        current_step: `Analyzing ${chunks.length} semantic chunks with Google AI...`,
        total_steps: chunks.length + 2,
        completed_steps: 0
      });

      // Use AIIntelligenceService which now uses Google AI
      const result = await AIIntelligenceService.extractChapterKnowledge(chapterId);

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
        current_step: 'Enhanced Google AI analysis complete',
        completed_steps: chunks.length + 2,
        progress_percentage: 100,
        results_summary: {
          chunks_processed: chunks.length,
          relationships_analyzed: true,
          knowledge_enhanced: true,
          extraction_method: 'google_ai',
          extractions_count: result.extractionsCount
        }
      });

      console.log('Enhanced Google AI analysis completed for chapter:', chapterId);
    } catch (error) {
      console.error('Enhanced Google AI analysis failed:', error);
      await ProcessingJobService.updateJobProgress(jobId, {
        state: 'failed',
        error_message: 'Enhanced knowledge extraction with Google AI failed',
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  private static async storeExtractedKnowledgeFromGoogleAI(
    extractedData: any,
    projectId: string,
    chapterId: string
  ): Promise<void> {
    try {
      console.log('Storing extracted knowledge from Google AI:', {
        characters: extractedData.characters?.length || 0,
        relationships: extractedData.relationships?.length || 0,
        plotThreads: extractedData.plotThreads?.length || 0,
        timelineEvents: extractedData.timelineEvents?.length || 0
      });

      // Store characters
      if (extractedData.characters && Array.isArray(extractedData.characters)) {
        for (const character of extractedData.characters) {
          await supabase.from('knowledge_base').insert({
            project_id: projectId,
            source_chapter_id: chapterId,
            name: character.name,
            category: 'character',
            description: character.description,
            confidence_score: character.confidence_score || 0.75,
            extraction_method: 'llm_direct',
            evidence: `Google AI extraction from chapter ${chapterId}`,
            details: {
              traits: character.traits || [],
              role: character.role
            }
          });
        }
      }

      // Store relationships
      if (extractedData.relationships && Array.isArray(extractedData.relationships)) {
        for (const relationship of extractedData.relationships) {
          await AIIntelligenceService.createCharacterRelationship({
            project_id: projectId,
            character_a_name: relationship.character_a_name,
            character_b_name: relationship.character_b_name,
            relationship_type: relationship.relationship_type,
            relationship_strength: relationship.relationship_strength || 5,
            confidence_score: relationship.confidence_score || 0.7,
            extraction_method: 'llm_direct',
            evidence: `Google AI extraction from chapter ${chapterId}`,
            relationship_start_chapter_id: chapterId,
            relationship_current_status: 'active'
          });
        }
      }

      // Store plot threads
      if (extractedData.plotThreads && Array.isArray(extractedData.plotThreads)) {
        for (const plotThread of extractedData.plotThreads) {
          await supabase.from('plot_threads').insert({
            project_id: projectId,
            thread_name: plotThread.thread_name,
            thread_type: plotThread.thread_type,
            key_events: plotThread.key_events || [],
            thread_status: plotThread.status || 'active',
            confidence_score: plotThread.confidence_score || 0.7,
            extraction_method: 'llm_direct',
            evidence: `Google AI extraction from chapter ${chapterId}`,
            start_chapter_id: chapterId
          });
        }
      }

      // Store timeline events
      if (extractedData.timelineEvents && Array.isArray(extractedData.timelineEvents)) {
        for (const event of extractedData.timelineEvents) {
          await supabase.from('timeline_events').insert({
            project_id: projectId,
            event_name: event.event_name,
            event_type: event.event_type,
            event_description: event.description,
            chronological_order: event.chronological_order || 0,
            characters_involved: event.characters_involved || [],
            confidence_score: event.confidence_score || 0.7,
            extraction_method: 'llm_direct',
            evidence: `Google AI extraction from chapter ${chapterId}`,
            chapter_id: chapterId
          });
        }
      }
      
      console.log('Successfully stored extracted knowledge from Google AI');
    } catch (error) {
      console.error('Error storing Google AI extracted knowledge:', error);
      throw error;
    }
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
            relationship_strength: 3,
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
