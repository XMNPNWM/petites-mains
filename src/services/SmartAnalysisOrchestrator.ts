import { supabase } from '@/integrations/supabase/client';
import { RefinementService } from './RefinementService';
import { ContentHashService } from './ContentHashService';
import { KnowledgeBase, ChapterSummary, PlotPoint } from '@/types/knowledge';

export class SmartAnalysisOrchestrator {
  static async analyzeChapter(projectId: string, chapterId: string): Promise<void> {
    try {
      console.log('Starting chapter analysis:', { projectId, chapterId });

      // Get chapter content
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError);
        throw new Error(`Failed to fetch chapter: ${chapterError.message}`);
      }

      if (!chapter?.content) {
        throw new Error('Chapter content is empty');
      }

      console.log('Chapter loaded, content length:', chapter.content.length);

      // Get or create refinement data for content enhancement
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      console.log('Refinement data ready:', refinementData.id);

      // Enhance content using the chat-with-ai edge function with gemini-2.5-flash-lite-preview-06-17
      try {
        const { data: enhancementResult, error: enhancementError } = await supabase.functions.invoke('chat-with-ai', {
          body: { 
            message: `Please enhance the following text for grammar, style, and readability while preserving the original meaning and tone:\n\n${chapter.content}`,
            projectId: projectId,
            chapterId: chapterId
          }
        });

        if (enhancementError) {
          console.error('Content enhancement failed:', enhancementError);
          throw new Error(`Content enhancement failed: ${enhancementError.message}`);
        }

        if (enhancementResult?.success && enhancementResult?.response) {
          await RefinementService.updateRefinementContent(refinementData.id, enhancementResult.response);
          console.log('Content enhanced successfully');
        } else {
          console.warn('Enhancement service returned invalid response, using original content');
          await RefinementService.updateRefinementContent(refinementData.id, chapter.content);
        }
      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Graceful fallback - use original content
        const fallbackContent = chapter.content + '\n\n[AI enhancement unavailable - content preserved as-is]';
        await RefinementService.updateRefinementContent(refinementData.id, fallbackContent);
        console.log('Using fallback content due to enhancement failure');
      }

      console.log('Chapter analysis completed successfully');

    } catch (error) {
      console.error('Analysis orchestrator error:', error);
      throw error;
    }
  }

  static async analyzeProject(projectId: string): Promise<any> {
    try {
      console.log('🚀 [SMART] Starting comprehensive project analysis:', projectId);

      // PHASE 1: Hash Verification - Check what actually needs analysis
      console.log('📋 Phase 1: Checking content hashes for all chapters');
      
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (chaptersError) {
        throw new Error(`Failed to fetch chapters: ${chaptersError.message}`);
      }

      if (!chapters || chapters.length === 0) {
        console.log('No chapters found for analysis');
        return {
          success: true,
          processingStats: {
            contentAnalyzed: 0,
            creditsUsed: 0,
            knowledgeExtracted: 0,
            chaptersSkipped: 0,
            hashVerificationSaved: true
          }
        };
      }

      // Check which chapters need analysis based on content hashes
      let chaptersNeedingAnalysis = [];
      let chaptersSkipped = 0;
      
      for (const chapter of chapters) {
        if (chapter.content && chapter.content.trim().length > 0) {
          try {
            const hashResult = await ContentHashService.verifyContentHash(chapter.id, chapter.content);
            console.log(`🔍 Hash check for chapter "${chapter.title}":`, hashResult);
            
            if (hashResult.hasChanges) {
              console.log(`🚨 Chapter "${chapter.title}" needs analysis - content changed`);
              chaptersNeedingAnalysis.push(chapter);
            } else {
              console.log(`✅ Chapter "${chapter.title}" skipped - no changes detected`);
              chaptersSkipped++;
            }
          } catch (hashError) {
            console.error(`⚠️ Hash verification failed for chapter ${chapter.id}:`, hashError);
            // If hash verification fails, include in analysis to be safe
            chaptersNeedingAnalysis.push(chapter);
          }
        }
      }

      // Check if this is the first analysis (no existing knowledge)
      const existingKnowledge = await this.getProjectKnowledge(projectId);
      const isFirstAnalysis = existingKnowledge.length === 0;

      if (isFirstAnalysis) {
        console.log('🆕 First analysis detected - analyzing all chapters regardless of hash status');
        chaptersNeedingAnalysis = chapters.filter(c => c.content && c.content.trim().length > 0);
        chaptersSkipped = 0;
      }

      console.log(`📊 Analysis plan: ${chaptersNeedingAnalysis.length} chapters to analyze, ${chaptersSkipped} chapters skipped`);

      if (chaptersNeedingAnalysis.length === 0) {
        console.log('✅ All chapters are up-to-date, no analysis needed');
        return {
          success: true,
          processingStats: {
            contentAnalyzed: 0,
            creditsUsed: 0,
            knowledgeExtracted: existingKnowledge.length,
            chaptersSkipped: chaptersSkipped,
            hashVerificationSaved: true,
            message: 'All content is up-to-date'
          }
        };
      }

      // PHASE 2: Enhanced Knowledge Extraction using comprehensive extract-knowledge function
      let totalContentAnalyzed = 0;
      let totalCreditsUsed = 0;
      let totalKnowledgeExtracted = 0;

      // Combine content from chapters that need analysis
      const contentToAnalyze = chaptersNeedingAnalysis.map(chapter => 
        `Chapter: ${chapter.title}\n${chapter.content || ''}`
      ).join('\n\n---CHAPTER_BREAK---\n\n');

      console.log(`🧠 Phase 2: Comprehensive knowledge extraction from ${chaptersNeedingAnalysis.length} chapters (${contentToAnalyze.length} chars)`);

      // Use the enhanced extract-knowledge edge function with comprehensive extraction
      const primaryChapterId = chaptersNeedingAnalysis[0]?.id;
      
      const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
        body: { 
          content: contentToAnalyze,
          projectId: projectId,
          extractionType: 'comprehensive',
          chapterId: primaryChapterId
        }
      });

      if (knowledgeError) {
        console.error('❌ Comprehensive knowledge extraction failed:', knowledgeError);
        throw new Error(`Knowledge extraction failed: ${knowledgeError.message}`);
      }

      if (knowledgeResult?.success && knowledgeResult.extractedData) {
        console.log('✅ Comprehensive knowledge extraction completed');
        console.log('📊 Extraction results:', {
          characters: knowledgeResult.extractedData.characters?.length || 0,
          relationships: knowledgeResult.extractedData.relationships?.length || 0,
          plotThreads: knowledgeResult.extractedData.plotThreads?.length || 0,
          timelineEvents: knowledgeResult.extractedData.timelineEvents?.length || 0,
          plotPoints: knowledgeResult.extractedData.plotPoints?.length || 0,
          chapterSummaries: knowledgeResult.extractedData.chapterSummaries?.length || 0,
          language: knowledgeResult.storageDetails?.language || 'unknown',
          extractionStats: knowledgeResult.storageDetails?.extractionStats || {}
        });

        // Store the extracted knowledge in the database
        const storedItems = await this.storeComprehensiveKnowledge(projectId, knowledgeResult.extractedData, chaptersNeedingAnalysis);
        totalKnowledgeExtracted = storedItems;
        
        console.log(`📚 Stored ${totalKnowledgeExtracted} knowledge items in database`);
        
        if (knowledgeResult.validation?.issues && knowledgeResult.validation.issues.length > 0) {
          console.warn('⚠️ Some issues occurred during extraction:', knowledgeResult.validation.issues);
        }
      } else {
        console.warn('⚠️ Knowledge extraction returned no data or failed silently');
      }

      // PHASE 3: Update content hashes for analyzed chapters
      console.log('🔄 Phase 3: Updating content hashes for analyzed chapters');
      
      for (const chapter of chaptersNeedingAnalysis) {
        try {
          await ContentHashService.updateContentHash(chapter.id, chapter.content || '');
          console.log(`✅ Updated hash for chapter "${chapter.title}"`);
        } catch (hashError) {
          console.error(`⚠️ Failed to update hash for chapter ${chapter.id}:`, hashError);
        }
      }

      // PHASE 4: Analyze individual chapters for refinement
      console.log('📝 Phase 4: Processing chapters for refinement');
      
      for (const chapter of chaptersNeedingAnalysis) {
        try {
          await this.analyzeChapter(projectId, chapter.id);
          totalContentAnalyzed++;
          totalCreditsUsed += 1; // Simplified credit counting
        } catch (error) {
          console.error(`Failed to analyze chapter ${chapter.id}:`, error);
          // Continue with other chapters
        }
      }

      console.log('✅ [SMART] Comprehensive project analysis completed successfully');

      return {
        success: true,
        processingStats: {
          contentAnalyzed: totalContentAnalyzed,
          creditsUsed: totalCreditsUsed,
          knowledgeExtracted: totalKnowledgeExtracted,
          chaptersSkipped: chaptersSkipped,
          hashVerificationSaved: chaptersSkipped > 0,
          extractionDetails: knowledgeResult?.storageDetails || {},
          message: chaptersSkipped > 0 
            ? `Analyzed ${chaptersNeedingAnalysis.length} changed chapters, skipped ${chaptersSkipped} unchanged chapters`
            : `Analyzed ${chaptersNeedingAnalysis.length} chapters with comprehensive extraction`
        }
      };

    } catch (error) {
      console.error('❌ [SMART] Comprehensive project analysis failed:', error);
      throw error;
    }
  }

  // Enhanced method to store all extracted knowledge types in database
  static async storeComprehensiveKnowledge(projectId: string, extractedData: any, sourceChapters: any[]): Promise<number> {
    let storedCount = 0;
    const sourceChapterIds = sourceChapters.map(c => c.id);

    try {
      // Store characters
      if (extractedData.characters && extractedData.characters.length > 0) {
        for (const character of extractedData.characters) {
          try {
            const { error } = await supabase
              .from('knowledge_base')
              .insert({
                project_id: projectId,
                name: character.name,
                category: 'character',
                subcategory: character.role,
                description: character.description,
                details: {
                  traits: character.traits || [],
                  role: character.role
                },
                confidence_score: character.ai_confidence || 0.5,
                extraction_method: 'llm_direct',
                source_chapter_ids: sourceChapterIds,
                is_newly_extracted: true,
                ai_confidence_new: character.ai_confidence || 0.5
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing character:', character.name, error);
            }
          } catch (charError) {
            console.error('Error processing character:', character, charError);
          }
        }
      }

      // Store relationships
      if (extractedData.relationships && extractedData.relationships.length > 0) {
        for (const relationship of extractedData.relationships) {
          try {
            const { error } = await supabase
              .from('character_relationships')
              .insert({
                project_id: projectId,
                character_a_name: relationship.character_a_name,
                character_b_name: relationship.character_b_name,
                relationship_type: relationship.relationship_type,
                relationship_strength: relationship.relationship_strength || 5,
                confidence_score: relationship.ai_confidence || 0.5,
                extraction_method: 'llm_direct',
                source_chapter_ids: sourceChapterIds,
                is_newly_extracted: true,
                ai_confidence_new: relationship.ai_confidence || 0.5,
                evidence: relationship.evidence || null
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing relationship:', relationship, error);
            }
          } catch (relError) {
            console.error('Error processing relationship:', relationship, relError);
          }
        }
      }

      // Store plot threads
      if (extractedData.plotThreads && extractedData.plotThreads.length > 0) {
        for (const plotThread of extractedData.plotThreads) {
          try {
            const { error } = await supabase
              .from('plot_threads')
              .insert({
                project_id: projectId,
                thread_name: plotThread.thread_name,
                thread_type: plotThread.thread_type,
                thread_status: plotThread.thread_status,
                key_events: plotThread.key_events || [],
                characters_involved_names: plotThread.characters_involved_names || [],
                confidence_score: plotThread.ai_confidence || 0.5,
                extraction_method: 'llm_direct',
                source_chapter_ids: sourceChapterIds,
                is_newly_extracted: true,
                ai_confidence_new: plotThread.ai_confidence || 0.5
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing plot thread:', plotThread, error);
            }
          } catch (plotError) {
            console.error('Error processing plot thread:', plotThread, plotError);
          }
        }
      }

      // Store timeline events
      if (extractedData.timelineEvents && extractedData.timelineEvents.length > 0) {
        for (const event of extractedData.timelineEvents) {
          try {
            const { error } = await supabase
              .from('timeline_events')
              .insert({
                project_id: projectId,
                event_summary: event.event_summary,
                chronological_order: event.chronological_order || 0,
                date_or_time_reference: event.date_or_time_reference,
                significance: event.significance,
                characters_involved_names: event.characters_involved_names || [],
                plot_threads_impacted_names: event.plot_threads_impacted_names || [],
                locations_involved_names: event.locations_involved_names || [],
                confidence_score: event.ai_confidence || 0.5,
                extraction_method: 'llm_direct',
                source_chapter_ids: sourceChapterIds,
                is_newly_extracted: true,
                ai_confidence_new: event.ai_confidence || 0.5
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing timeline event:', event, error);
            }
          } catch (eventError) {
            console.error('Error processing timeline event:', event, eventError);
          }
        }
      }

      // Store plot points
      if (extractedData.plotPoints && extractedData.plotPoints.length > 0) {
        for (const plotPoint of extractedData.plotPoints) {
          try {
            const { error } = await supabase
              .from('plot_points')
              .insert({
                project_id: projectId,
                name: plotPoint.name,
                description: plotPoint.description,
                plot_thread_name: plotPoint.plot_thread_name,
                significance: plotPoint.significance,
                characters_involved_names: plotPoint.characters_involved_names || [],
                ai_confidence: plotPoint.ai_confidence || 0.5,
                source_chapter_ids: sourceChapterIds,
                is_newly_extracted: true
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing plot point:', plotPoint, error);
            }
          } catch (plotPointError) {
            console.error('Error processing plot point:', plotPoint, plotPointError);
          }
        }
      }

      // Store chapter summaries
      if (extractedData.chapterSummaries && extractedData.chapterSummaries.length > 0) {
        for (const summary of extractedData.chapterSummaries) {
          try {
            const { error } = await supabase
              .from('chapter_summaries')
              .insert({
                project_id: projectId,
                chapter_id: sourceChapters[0]?.id, // Use first chapter as primary reference
                title: summary.title,
                summary_short: summary.summary_short,
                summary_long: summary.summary_long,
                key_events_in_chapter: summary.key_events_in_chapter || [],
                primary_focus: summary.primary_focus || [],
                ai_confidence: summary.ai_confidence || 0.5,
                is_newly_extracted: true
              });

            if (!error) {
              storedCount++;
            } else {
              console.error('Error storing chapter summary:', summary, error);
            }
          } catch (summaryError) {
            console.error('Error processing chapter summary:', summary, summaryError);
          }
        }
      }

      console.log(`✅ Successfully stored ${storedCount} comprehensive knowledge items`);
      return storedCount;

    } catch (error) {
      console.error('❌ Error storing comprehensive knowledge:', error);
      return storedCount;
    }
  }

  static async getProjectKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project knowledge:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        details: (item.details as Record<string, any>) || {}
      })) as KnowledgeBase[];
    } catch (error) {
      console.error('Error in getProjectKnowledge:', error);
      return [];
    }
  }

  static async getChapterSummaries(projectId: string): Promise<ChapterSummary[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_summaries')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chapter summaries:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        key_events_in_chapter: (item.key_events_in_chapter as string[]) || [],
        primary_focus: (item.primary_focus as string[]) || []
      })) as ChapterSummary[];
    } catch (error) {
      console.error('Error in getChapterSummaries:', error);
      return [];
    }
  }

  static async getPlotPoints(projectId: string): Promise<PlotPoint[]> {
    try {
      const { data, error } = await supabase
        .from('plot_points')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plot points:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        characters_involved_names: (item.characters_involved_names as string[]) || [],
        source_chapter_ids: (item.source_chapter_ids as string[]) || []
      })) as PlotPoint[];
    } catch (error) {
      console.error('Error in getPlotPoints:', error);
      return [];
    }
  }

  static async getFlaggedKnowledge(projectId: string): Promise<KnowledgeBase[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flagged knowledge:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        details: (item.details as Record<string, any>) || {}
      })) as KnowledgeBase[];
    } catch (error) {
      console.error('Error in getFlaggedKnowledge:', error);
      return [];
    }
  }

  static async retryAnalysis(projectId: string, chapterId: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Analysis attempt ${attempt}/${maxRetries}`);
        await this.analyzeChapter(projectId, chapterId);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Analysis attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Analysis failed after multiple attempts');
  }
}
