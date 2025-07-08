
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

      // PHASE 2: Comprehensive Knowledge Extraction using enhanced extract-knowledge function
      let totalContentAnalyzed = 0;
      let totalCreditsUsed = 0;
      let totalKnowledgeExtracted = 0;

      // Combine content from chapters that need analysis
      const contentToAnalyze = chaptersNeedingAnalysis.map(chapter => 
        `Chapter: ${chapter.title}\n${chapter.content || ''}`
      ).join('\n\n---CHAPTER_BREAK---\n\n');

      console.log(`🧠 Phase 2: Comprehensive knowledge extraction from ${chaptersNeedingAnalysis.length} chapters (${contentToAnalyze.length} chars)`);

      // Use the enhanced extract-knowledge edge function with comprehensive extraction
      // For multiple chapters, we'll create a combined analysis with first chapter as primary
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
        console.error('Comprehensive knowledge extraction failed:', knowledgeError);
        throw new Error(`Knowledge extraction failed: ${knowledgeError.message}`);
      }

      if (knowledgeResult?.success) {
        totalKnowledgeExtracted = knowledgeResult.storedCount || 0;
        console.log(`✅ Comprehensive knowledge extraction completed: ${totalKnowledgeExtracted} items extracted`);
        console.log('📊 Storage breakdown:', knowledgeResult.storageDetails);
        
        if (knowledgeResult.errors && knowledgeResult.errors.length > 0) {
          console.warn('Some errors occurred during storage:', knowledgeResult.errors);
        }
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
          comprehensiveExtraction: knowledgeResult?.storageDetails || {},
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
