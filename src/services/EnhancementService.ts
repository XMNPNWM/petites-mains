
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

      // Get chapter content - CRITICAL: Use the specific chapter ID
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();

      if (chapterError) {
        console.error('❌ Error fetching chapter:', chapterError);
        throw new Error(`Failed to fetch chapter: ${chapterError.message}`);
      }

      if (!chapter?.content) {
        throw new Error('Chapter content is empty');
      }

      console.log('📖 Chapter loaded:', {
        id: chapter.id,
        title: chapter.title,
        contentLength: chapter.content.length,
        contentPreview: chapter.content.substring(0, 100)
      });

      // Get or create refinement data for THIS SPECIFIC CHAPTER
      let refinementData = await RefinementService.fetchRefinementData(chapterId);
      if (!refinementData) {
        console.log('Creating new refinement data for chapter:', chapterId);
        refinementData = await RefinementService.createRefinementData(chapterId, chapter.content);
        if (!refinementData) {
          throw new Error('Failed to create refinement data');
        }
      }

      // CRITICAL VALIDATION: Ensure refinement belongs to the correct chapter
      if (refinementData.chapter_id !== chapterId) {
        const error = new Error(`CRITICAL: Refinement data chapter mismatch! Expected: ${chapterId}, Found: ${refinementData.chapter_id}`);
        console.error('❌', error.message);
        throw error;
      }

      console.log('📋 Refinement data validated:', {
        refinementId: refinementData.id,
        chapterId: refinementData.chapter_id,
        originalContentLength: refinementData.original_content?.length || 0
      });

      // Enhance content using the enhance-chapter edge function
      try {
        console.log('🚀 Calling enhance-chapter edge function');
        console.log('📤 Request data:', {
          projectId,
          chapterId,
          contentLength: chapter.content.length,
          contentPreview: chapter.content.substring(0, 50)
        });
        
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

        console.log('📥 Enhancement result received:', {
          hasData: !!enhancementResult,
          hasEnhancedContent: !!enhancementResult?.enhancedContent,
          enhancedContentLength: enhancementResult?.enhancedContent?.length || 0,
          enhancedContentPreview: enhancementResult?.enhancedContent?.substring(0, 50) || '',
          hasChanges: !!enhancementResult?.changes,
          changesCount: enhancementResult?.changes?.length || 0
        });

        if (enhancementError) {
          console.error('❌ Content enhancement failed:', enhancementError);
          throw new Error(`Content enhancement failed: ${enhancementError.message}`);
        }

        // CRITICAL VALIDATION: Verify enhanced content is different from input
        if (enhancementResult?.enhancedContent) {
          const enhancedContent = enhancementResult.enhancedContent;
          
          // Basic sanity check - enhanced content shouldn't be identical to input
          if (enhancedContent === chapter.content) {
            console.warn('⚠️ Enhanced content is identical to original content');
          }
          
          // CRITICAL: Save enhanced content ONLY to the specific chapter's refinement
          console.log('💾 Saving enhanced content to refinement:', {
            refinementId: refinementData.id,
            chapterId: refinementData.chapter_id,
            expectedChapterId: chapterId
          });
          
          await RefinementService.updateRefinementContent(
            refinementData.id, 
            enhancedContent,
            chapterId // Pass expected chapter ID for validation
          );
          
          console.log('✅ Enhanced content saved successfully');
          
          // Process and save individual changes to the ai_change_tracking table
          if (enhancementResult.changes && Array.isArray(enhancementResult.changes)) {
            console.log('💾 Saving change tracking data, count:', enhancementResult.changes.length);
            await EnhancementService.saveChangeTrackingData(refinementData.id, enhancementResult.changes);
          }
        } else {
          console.warn('⚠️ Enhancement service returned no enhanced content, using original content');
          await RefinementService.updateRefinementContent(
            refinementData.id, 
            chapter.content,
            chapterId
          );
        }
        
        // Call the completion callback to refresh UI
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback');
          onComplete();
        }

      } catch (aiError) {
        console.error('❌ AI enhancement failed:', aiError);
        // Graceful fallback - use original content
        const fallbackContent = chapter.content + '\n\n[AI enhancement unavailable - content preserved as-is]';
        await RefinementService.updateRefinementContent(
          refinementData.id, 
          fallbackContent,
          chapterId
        );
        console.log('Using fallback content due to enhancement failure');
        
        // Call the completion callback even on fallback
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback (fallback)');
          onComplete();
        }
      }

      console.log('✅ EnhancementService: Chapter enhancement completed successfully');

    } catch (error) {
      console.error('❌ EnhancementService error:', error);
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
          console.error('❌ Error saving change tracking data:', error);
          throw error;
        }
        
        console.log('✅ Successfully saved', changeRecords.length, 'change tracking records');
      }
    } catch (error) {
      console.error('❌ Error in saveChangeTrackingData:', error);
      // Don't throw error here as change tracking is not critical for the main functionality
    }
  }
}
