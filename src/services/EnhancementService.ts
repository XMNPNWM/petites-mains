import { supabase } from '@/integrations/supabase/client';
import { RefinementService } from './RefinementService';

/**
 * Dedicated service for content enhancement functionality
 * Simplified and focused on enhancement without complex analysis dependencies
 */
export class EnhancementService {
  /**
   * Enhance a chapter's content using AI
   * @param projectId - The project ID
   * @param chapterId - The chapter ID to enhance
   * @param onComplete - Optional callback when enhancement is complete
   */
  static async enhanceChapter(projectId: string, chapterId: string, onComplete?: () => void): Promise<void> {
    try {
      console.log('🎯 EnhancementService: Starting chapter enhancement:', { projectId, chapterId });

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

      console.log('📖 Chapter loaded, content length:', chapter.content.length);

      // Get or create refinement data for content enhancement
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      console.log('📋 Refinement data ready:', refinementData.id);

      // Enhance content using the enhance-chapter edge function
      try {
        console.log('🚀 Calling enhance-chapter edge function with content length:', chapter.content.length);
        
        const { data: enhancementResult, error: enhancementError } = await supabase.functions.invoke('enhance-chapter', {
          body: { 
            content: chapter.content,
            projectId: projectId,
            chapterId: chapterId,
            options: {
              enhancementLevel: 'moderate',
              preserveAuthorVoice: true,
              applyGrammarFixes: true,
              applyPunctuationFixes: true,
              applyFormattingFixes: true,
              improveReadability: true,
              improveStyle: true,
              improveShowVsTell: false,
              refinePacing: false,
              enhanceCharacterVoice: true,
              addSensoryDetails: false
            }
          }
        });

        // DEBUG: Log the complete enhancement result
        console.log('🔍 EnhancementService Full Debug:', {
          data: enhancementResult,
          error: enhancementError,
          dataType: typeof enhancementResult,
          enhancedContentExists: !!enhancementResult?.enhancedContent,
          enhancedContentLength: enhancementResult?.enhancedContent?.length || 0,
          allDataKeys: enhancementResult ? Object.keys(enhancementResult) : []
        });

        if (enhancementError) {
          console.error('Content enhancement failed:', enhancementError);
          throw new Error(`Content enhancement failed: ${enhancementError.message}`);
        }

        if (enhancementResult?.enhancedContent) {
          await RefinementService.updateRefinementContent(refinementData.id, enhancementResult.enhancedContent);
          console.log('✅ Content enhanced successfully, length:', enhancementResult.enhancedContent.length);
          
          // Process and save individual changes to the ai_change_tracking table
          if (enhancementResult.changes && Array.isArray(enhancementResult.changes)) {
            console.log('💾 Saving change tracking data, count:', enhancementResult.changes.length);
            await EnhancementService.saveChangeTrackingData(refinementData.id, enhancementResult.changes);
          }
        } else {
          console.warn('Enhancement service returned no enhanced content, using original content');
          await RefinementService.updateRefinementContent(refinementData.id, chapter.content);
        }
        
        // Call the completion callback to refresh UI
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback');
          onComplete();
        }

      } catch (aiError) {
        console.error('AI enhancement failed:', aiError);
        // Graceful fallback - use original content
        const fallbackContent = chapter.content + '\n\n[AI enhancement unavailable - content preserved as-is]';
        await RefinementService.updateRefinementContent(refinementData.id, fallbackContent);
        console.log('Using fallback content due to enhancement failure');
        
        // Call the completion callback even on fallback
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback (fallback)');
          onComplete();
        }
      }

      console.log('✅ EnhancementService: Chapter enhancement completed successfully');

    } catch (error) {
      console.error('EnhancementService error:', error);
      throw error;
    }
  }

  /**
   * Save individual changes to the ai_change_tracking table
   */
  static async saveChangeTrackingData(refinementId: string, changes: any[]): Promise<void> {
    try {
      console.log('💾 Saving change tracking data for refinement:', refinementId);
      
      // First, clear existing changes for this refinement
      await supabase
        .from('ai_change_tracking')
        .delete()
        .eq('refinement_id', refinementId);
      
      // Insert new changes
      const changeRecords = changes.map(change => ({
        refinement_id: refinementId,
        change_type: change.change_type || 'style',
        original_text: change.original_text || '',
        enhanced_text: change.enhanced_text || '',
        position_start: change.position_start || 0,
        position_end: change.position_end || 0,
        confidence_score: change.confidence_score || 0.5,
        user_decision: change.user_decision || 'pending'
      }));
      
      if (changeRecords.length > 0) {
        const { error } = await supabase
          .from('ai_change_tracking')
          .insert(changeRecords);
        
        if (error) {
          console.error('Error saving change tracking data:', error);
          throw error;
        }
        
        console.log('✅ Successfully saved', changeRecords.length, 'change tracking records');
      }
    } catch (error) {
      console.error('Error in saveChangeTrackingData:', error);
      // Don't throw error here as change tracking is not critical for the main functionality
    }
  }
}