
import { supabase } from '@/integrations/supabase/client';
import { RefinementService } from './RefinementService';
import { ContentVersioningService } from './ContentVersioningService';
import { EnhancementTimeoutService } from './EnhancementTimeoutService';

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
    let refinementData: any = null; // Declare in outer scope for error handling
    
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
      refinementData = await RefinementService.fetchRefinementData(chapterId);
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
        originalContentLength: refinementData.original_content?.length || 0,
        hasExistingEnhancedContent: !!refinementData.enhanced_content
      });

      // NEW: Create backup of existing enhanced content before overwriting
      if (refinementData.enhanced_content && refinementData.enhanced_content.trim().length > 0) {
        console.log('💾 Creating backup of existing enhanced content before re-enhancement');
        await ContentVersioningService.createContentVersion(
          chapterId,
          'enhancement',
          refinementData.enhanced_content,
          {
            refinementId: refinementData.id,
            changeSummary: 'Previous enhanced version (backup before re-enhancement)',
            userNotes: 'Automatic backup created before applying new enhancement'
          }
        );
      }

      // REQUIREMENT 1: Clear previous changes before starting enhancement
      console.log('🧹 Clearing previous changes for fresh enhancement');
      await EnhancementService.clearPreviousChanges(refinementData.id, chapterId);

      // CRITICAL: Set status to "in_progress" at the start of enhancement
      console.log('🔄 Setting refinement status to "in_progress"');
      await EnhancementService.updateRefinementStatus(refinementData.id, 'in_progress', chapterId);

      // REQUIREMENT 3: Start timeout monitoring
      EnhancementTimeoutService.startTimeout(refinementData.id, chapterId);

      // Enhance content using the enhance-chapter edge function
      try {
        console.log('🚀 Calling enhance-chapter edge function');
        console.log('📤 Request data:', {
          projectId,
          chapterId,
          contentLength: chapter.content.length,
          contentPreview: chapter.content.substring(0, 50)
        });
        
        // DIAGNOSTIC: Add timestamp and detailed logging
        const invokeStartTime = Date.now();
        console.log('⏰ Edge function invocation starting at:', new Date().toISOString());
        
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

        // ============= CRITICAL DEBUGGING SECTION =============
        console.group('🔍 DETAILED EDGE FUNCTION RESPONSE ANALYSIS');
        console.log('📊 Response structure analysis:');
        console.log('- Raw enhancementResult:', enhancementResult);
        console.log('- Type of enhancementResult:', typeof enhancementResult);
        console.log('- Is enhancementResult null?:', enhancementResult === null);
        console.log('- Is enhancementResult undefined?:', enhancementResult === undefined);
        console.log('- enhancementResult keys:', enhancementResult ? Object.keys(enhancementResult) : 'N/A');
        
        if (enhancementResult) {
          console.log('📝 Enhanced content analysis:');
          console.log('- Has enhancedContent property?:', 'enhancedContent' in enhancementResult);
          console.log('- enhancedContent type:', typeof enhancementResult.enhancedContent);
          console.log('- enhancedContent length:', enhancementResult.enhancedContent?.length || 0);
          console.log('- enhancedContent preview:', enhancementResult.enhancedContent?.substring(0, 100) || '[EMPTY]');
          
          console.log('🔄 Changes analysis:');
          console.log('- Has changes property?:', 'changes' in enhancementResult);
          console.log('- changes type:', typeof enhancementResult.changes);
          console.log('- changes is array?:', Array.isArray(enhancementResult.changes));
          console.log('- changes length:', enhancementResult.changes?.length || 0);
          
          if (enhancementResult.changes && Array.isArray(enhancementResult.changes)) {
            console.log('- First change sample:', enhancementResult.changes[0]);
          }
        }
        
        if (enhancementError) {
          console.error('💥 Enhancement error details:');
          console.error('- Error object:', enhancementError);
          console.error('- Error message:', enhancementError.message);
          console.error('- Error details:', enhancementError.details);
          console.error('- Error code:', enhancementError.code);
        }
        console.groupEnd();
        // ============= END DEBUGGING SECTION =============

        // DIAGNOSTIC: Log function call completion
        const invokeEndTime = Date.now();
        console.log('⏰ Edge function invocation completed at:', new Date().toISOString());
        console.log('⏱️ Total invocation time:', (invokeEndTime - invokeStartTime), 'ms');
        console.log('🔍 Raw enhancement response:', { enhancementResult, enhancementError });

        // PHASE 3: Enhanced logging for debugging
        console.log('📥 Enhancement result received:', {
          hasData: !!enhancementResult,
          hasEnhancedContent: !!enhancementResult?.enhancedContent,
          enhancedContentLength: enhancementResult?.enhancedContent?.length || 0,
          enhancedContentPreview: enhancementResult?.enhancedContent?.substring(0, 50) || '',
          hasChanges: !!enhancementResult?.changes,
          changesCount: enhancementResult?.changes?.length || 0,
          enhancementError: enhancementError ? enhancementError.message : null
        });

        // PHASE 3: Log changes structure for debugging
        if (enhancementResult?.changes && Array.isArray(enhancementResult.changes)) {
          console.log('🔍 PHASE 3: Changes array structure analysis:', {
            totalChanges: enhancementResult.changes.length,
            firstChangeKeys: enhancementResult.changes[0] ? Object.keys(enhancementResult.changes[0]) : [],
            hasDualPositions: enhancementResult.changes.some(c => 
              c.original_position_start !== undefined && c.enhanced_position_start !== undefined
            ),
            sampleChange: enhancementResult.changes[0]
          });
        }

        if (enhancementError) {
          console.error('❌ Content enhancement failed:', enhancementError);
          // REQUIREMENT 3: Set terminal status on failure and clear timeout
          await EnhancementService.updateRefinementStatus(refinementData.id, 'failed', chapterId);
          EnhancementTimeoutService.clearTimeout(refinementData.id);
          throw new Error(`Content enhancement failed: ${enhancementError.message}`);
        }

        // CRITICAL VALIDATION: Verify enhanced content is valid and meaningful
        if (enhancementResult?.enhancedContent) {
          const enhancedContent = enhancementResult.enhancedContent;
          
          // PHASE 3: Additional validation to prevent empty/minimal content
          const isEmptyOrMinimal = !enhancedContent || 
                                   enhancedContent.trim().length === 0 || 
                                   enhancedContent.trim() === '<p></p>' ||
                                   enhancedContent.trim().length < 10;
          
          if (isEmptyOrMinimal) {
            console.error('❌ Enhanced content is empty or minimal:', {
              enhancedContent: enhancedContent,
              length: enhancedContent?.length || 0
            });
            // Set failed status and don't save empty content
            await EnhancementService.updateRefinementStatus(refinementData.id, 'failed', chapterId);
            EnhancementTimeoutService.clearTimeout(refinementData.id);
            throw new Error('Enhancement failed: Received empty or minimal content from AI service');
          }
          
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
          
          console.group('🔍 DATABASE UPDATE DEBUGGING');
          console.log('🏁 Starting updateRefinementContent...');
          
          try {
            await RefinementService.updateRefinementContent(
              refinementData.id, 
              enhancedContent,
              chapterId // Pass expected chapter ID for validation
            );
            console.log('✅ updateRefinementContent completed successfully');
          } catch (updateError) {
            console.error('💥 updateRefinementContent failed:', updateError);
            console.groupEnd();
            throw updateError;
          }
          
          console.log('✅ Enhanced content saved successfully');
          console.groupEnd();

          // NEW: Create version record for the new enhanced content
          await ContentVersioningService.createContentVersion(
            chapterId,
            'enhancement',
            enhancedContent,
            {
              refinementId: refinementData.id,
              changeSummary: 'New enhanced version created',
              userNotes: 'Latest AI enhancement applied to content'
            }
          );
          
          // CRITICAL: Set status to "completed" after successful enhancement and save
          console.group('🔍 STATUS UPDATE DEBUGGING');
          console.log('🎉 Setting refinement status to "completed"');
          
          try {
            await EnhancementService.updateRefinementStatus(refinementData.id, 'completed', chapterId);
            // REQUIREMENT 3: Clear timeout monitoring on completion
            EnhancementTimeoutService.clearTimeout(refinementData.id);
            console.log('✅ Status update to "completed" successful');
          } catch (statusError) {
            console.error('💥 Status update failed:', statusError);
            console.groupEnd();
            throw statusError;
          }
          console.groupEnd();
          
          // PHASE 3: Process and save individual changes to the ai_change_tracking table
          if (enhancementResult.changes && Array.isArray(enhancementResult.changes)) {
            console.group('🔍 PHASE 3: CHANGE TRACKING DEBUGGING');
            console.log('💾 Saving change tracking data, count:', enhancementResult.changes.length);
            console.log('📊 Changes validation:', {
              allHaveRequiredFields: enhancementResult.changes.every(c => 
                c.original_text !== undefined && c.enhanced_text !== undefined
              ),
              allHaveDualPositions: enhancementResult.changes.every(c => 
                c.original_position_start !== undefined && c.enhanced_position_start !== undefined
              ),
              changesWithValidPositions: enhancementResult.changes.filter(c => 
                c.original_position_start !== undefined && c.enhanced_position_start !== undefined
              ).length
            });
            
            try {
              await EnhancementService.saveChangeTrackingData(refinementData.id, enhancementResult.changes);
              console.log('✅ Change tracking data saved successfully');
              
              // PHASE 3: Verify data was actually saved
              const { data: verificationData, error: verificationError } = await supabase
                .from('ai_change_tracking')
                .select('id, change_type, original_position_start, enhanced_position_start')
                .eq('refinement_id', refinementData.id)
                .limit(5);
                
              if (verificationError) {
                console.error('💥 Change tracking verification failed:', verificationError);
              } else {
                console.log('🔍 PHASE 3: Change tracking verification - saved records sample:', verificationData);
              }
            } catch (trackingError) {
              console.error('💥 Change tracking save failed:', trackingError);
              console.error('💥 Error details:', {
                message: trackingError.message,
                code: trackingError.code,
                details: trackingError.details
              });
              // Don't throw here since it's not critical for main functionality
            }
            console.groupEnd();
          } else {
            console.warn('⚠️ PHASE 3: No changes array found in enhancement result - skipping change tracking');
            console.log('🔍 PHASE 3: Enhancement result structure:', {
              keys: enhancementResult ? Object.keys(enhancementResult) : 'null',
              changesProperty: enhancementResult?.changes,
              changesType: typeof enhancementResult?.changes
            });
          }
        } else {
          console.warn('⚠️ Enhancement service returned no enhanced content, using original content');
          await RefinementService.updateRefinementContent(
            refinementData.id, 
            chapter.content,
            chapterId
          );
          // Set status to completed even with fallback content
          await EnhancementService.updateRefinementStatus(refinementData.id, 'completed', chapterId);
        }
        
        // Call the completion callback to refresh UI
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback');
          onComplete();
        }

      } catch (aiError) {
        console.error('❌ AI enhancement failed:', aiError);
        
        // REQUIREMENT 3: Set terminal status on failure and clear timeout
        await EnhancementService.updateRefinementStatus(refinementData.id, 'failed', chapterId);
        EnhancementTimeoutService.clearTimeout(refinementData.id);
        
        // Call the completion callback to ensure UI updates
        if (onComplete) {
          console.log('🔄 Triggering UI refresh callback (failure)');
          onComplete();
        }
        
        // Re-throw to maintain error handling
        throw aiError;
      }

      console.log('✅ EnhancementService: Chapter enhancement completed successfully');

    } catch (error) {
      console.error('❌ EnhancementService error:', error);
      
      // REQUIREMENT 3: Ensure terminal status on any error and clear timeout
      try {
        if (refinementData?.id) {
          await EnhancementService.updateRefinementStatus(refinementData.id, 'failed', chapterId);
          EnhancementTimeoutService.clearTimeout(refinementData.id);
        }
      } catch (statusError) {
        console.error('❌ Failed to set terminal status on error:', statusError);
      }
      
      throw error;
    }
  }

  /**
   * REQUIREMENT 1: Clear previous changes to ensure fresh display
   */
  static async clearPreviousChanges(refinementId: string, expectedChapterId: string): Promise<void> {
    try {
      console.log('🧹 Clearing previous changes:', { refinementId, expectedChapterId });

      // REQUIREMENT 2: Validate chapter ownership before clearing
      const { data: refinementData, error: fetchError } = await supabase
        .from('chapter_refinements')
        .select('chapter_id')
        .eq('id', refinementId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to validate refinement for change clearing:', fetchError);
        throw fetchError;
      }

      if (refinementData.chapter_id !== expectedChapterId) {
        const error = new Error(`CRITICAL: Change clearing chapter mismatch! Expected: ${expectedChapterId}, Found: ${refinementData.chapter_id}`);
        console.error('❌ Change clearing validation failed:', error.message);
        throw error;
      }

      // Clear previous changes for this specific refinement
      const { error: deleteError } = await supabase
        .from('ai_change_tracking')
        .delete()
        .eq('refinement_id', refinementId);

      if (deleteError) {
        console.error('❌ Failed to clear previous changes:', deleteError);
        throw deleteError;
      }

      console.log('✅ Previous changes cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing previous changes:', error);
      throw error;
    }
  }

  /**
   * Update refinement status with strict chapter isolation
   */
  static async updateRefinementStatus(
    refinementId: string, 
    status: 'untouched' | 'in_progress' | 'completed' | 'failed', 
    expectedChapterId: string
  ): Promise<void> {
    try {
      console.log('🔄 Updating refinement status:', {
        refinementId,
        newStatus: status,
        expectedChapterId
      });

      // CRITICAL VALIDATION: Verify refinement belongs to expected chapter
      const { data: existingData, error: fetchError } = await supabase
        .from('chapter_refinements')
        .select('chapter_id, id, refinement_status')
        .eq('id', refinementId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to validate refinement for status update:', fetchError);
        throw fetchError;
      }

      if (existingData.chapter_id !== expectedChapterId) {
        const error = new Error(`CRITICAL: Status update chapter mismatch! Expected: ${expectedChapterId}, Found: ${existingData.chapter_id}`);
        console.error('❌ Status update validation failed:', error.message);
        throw error;
      }

      console.log('✅ Status update validation passed');

      // Update ONLY the specific refinement record
      const { data, error } = await supabase
        .from('chapter_refinements')
        .update({
          refinement_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', refinementId)
        .select('id, chapter_id, refinement_status');

      if (error) {
        console.error('❌ Status update failed:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        const error = new Error('No refinement record was updated during status change!');
        console.error('❌', error.message);
        throw error;
      }

      console.log('✅ Refinement status updated successfully:', {
        updatedRecords: data.length,
        refinementId: data[0].id,
        chapterId: data[0].chapter_id,
        newStatus: data[0].refinement_status
      });
      
    } catch (error) {
      console.error('❌ Error updating refinement status:', error);
      throw error;
    }
  }

  static async saveChangeTrackingData(refinementId: string, changes: any[]): Promise<void> {
    try {
      console.log('💾 Saving change tracking data for refinement:', refinementId);
      
      // First, clear existing changes for this refinement
      await supabase
        .from('ai_change_tracking')
        .delete()
        .eq('refinement_id', refinementId);
      
      // Insert new changes with dual-position format
      const changeRecords = changes.map(change => ({
        refinement_id: refinementId,
        change_type: change.change_type || 'style',
        original_text: change.original_text || '',
        enhanced_text: change.enhanced_text || '',
        original_position_start: change.original_position_start || 0,
        original_position_end: change.original_position_end || 0,
        enhanced_position_start: change.enhanced_position_start || 0,
        enhanced_position_end: change.enhanced_position_end || 0,
        confidence_score: change.confidence_score || 0.5,
        semantic_similarity: change.semantic_similarity,
        semantic_impact: change.semantic_impact,
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
        
        console.log('✅ Successfully saved', changeRecords.length, 'change tracking records with dual positions');
      }
    } catch (error) {
      console.error('❌ Error in saveChangeTrackingData:', error);
      // Don't throw error here as change tracking is not critical for the main functionality
    }
  }
}
