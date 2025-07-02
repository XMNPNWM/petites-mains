
import { supabase } from '@/integrations/supabase/client';
import { GoogleAIService } from './GoogleAIService';
import { RefinementService } from './RefinementService';

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

      // Get or create refinement data
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      console.log('Refinement data ready:', refinementData.id);

      // Enhance content using Google AI
      try {
        const enhancedContent = await GoogleAIService.enhanceContent(chapter.content);
        console.log('Content enhanced, length:', enhancedContent.length);

        // Update refinement with enhanced content
        await RefinementService.updateRefinementContent(refinementData.id, enhancedContent);
        console.log('Analysis completed successfully');

      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        
        // Graceful fallback - use original content with improvements note
        const fallbackContent = chapter.content + '\n\n[AI enhancement unavailable - content preserved as-is]';
        await RefinementService.updateRefinementContent(refinementData.id, fallbackContent);
        
        throw new Error('AI enhancement service is currently unavailable. Please try again later.');
      }

    } catch (error) {
      console.error('Analysis orchestrator error:', error);
      
      // Provide user-friendly error message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during analysis. Please try again.');
      }
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
