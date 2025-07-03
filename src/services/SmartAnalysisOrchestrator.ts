import { supabase } from '@/integrations/supabase/client';
import { RefinementService } from './RefinementService';
import { KnowledgeBase } from '@/types/knowledge';

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

      // Extract knowledge using the new edge function
      console.log('Extracting knowledge from chapter content');
      const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
        body: { 
          content: chapter.content,
          projectId: projectId,
          extractionType: 'comprehensive'
        }
      });

      if (knowledgeError) {
        console.error('Knowledge extraction failed:', knowledgeError);
        throw new Error(`Knowledge extraction failed: ${knowledgeError.message}`);
      }

      console.log('Knowledge extraction completed:', knowledgeResult);

      // Get or create refinement data for content enhancement
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      console.log('Refinement data ready:', refinementData.id);

      // Enhance content using the chat-with-ai edge function
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

      // Get all chapters for the project
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
            knowledgeExtracted: 0
          }
        };
      }

      let totalContentAnalyzed = 0;
      let totalCreditsUsed = 0;
      let totalKnowledgeExtracted = 0;

      // Combine all chapter content for comprehensive analysis
      const allContent = chapters.map(chapter => 
        `Chapter: ${chapter.title}\n${chapter.content || ''}`
      ).join('\n\n---CHAPTER_BREAK---\n\n');

      console.log('Combined content length:', allContent.length);

      // Extract knowledge from all content at once for better context
      console.log('Starting comprehensive knowledge extraction');
      const { data: knowledgeResult, error: knowledgeError } = await supabase.functions.invoke('extract-knowledge', {
        body: { 
          content: allContent,
          projectId: projectId,
          extractionType: 'comprehensive'
        }
      });

      if (knowledgeError) {
        console.error('Project knowledge extraction failed:', knowledgeError);
        throw new Error(`Knowledge extraction failed: ${knowledgeError.message}`);
      }

      if (knowledgeResult?.success) {
        totalKnowledgeExtracted = knowledgeResult.storedCount || 0;
        console.log(`Knowledge extraction completed: ${totalKnowledgeExtracted} items extracted`);
      }

      // Analyze each chapter individually for refinement
      for (const chapter of chapters) {
        try {
          if (chapter.content && chapter.content.trim().length > 0) {
            await this.analyzeChapter(projectId, chapter.id);
            totalContentAnalyzed++;
            totalCreditsUsed += 1; // Simplified credit counting
          }
        } catch (error) {
          console.error(`Failed to analyze chapter ${chapter.id}:`, error);
          // Continue with other chapters
        }
      }

      console.log('✅ [SMART] Project analysis completed successfully');

      return {
        success: true,
        processingStats: {
          contentAnalyzed: totalContentAnalyzed,
          creditsUsed: totalCreditsUsed,
          knowledgeExtracted: totalKnowledgeExtracted
        }
      };

    } catch (error) {
      console.error('❌ [SMART] Project analysis failed:', error);
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
