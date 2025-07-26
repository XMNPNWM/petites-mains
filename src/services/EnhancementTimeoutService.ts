import { supabase } from '@/integrations/supabase/client';

/**
 * REQUIREMENT 3: Service for handling enhancement timeouts and cleanup
 */
export class EnhancementTimeoutService {
  private static readonly TIMEOUT_MINUTES = 30; // Maximum enhancement time
  private static timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Start timeout monitoring for an enhancement
   */
  static startTimeout(refinementId: string, chapterId: string): void {
    console.log('⏰ Starting enhancement timeout monitoring:', { refinementId, timeoutMinutes: this.TIMEOUT_MINUTES });

    // Clear any existing timeout for this refinement
    this.clearTimeout(refinementId);

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      console.warn('⚠️ Enhancement timeout reached for refinement:', refinementId);
      await this.handleTimeout(refinementId, chapterId);
    }, this.TIMEOUT_MINUTES * 60 * 1000);

    this.timeouts.set(refinementId, timeoutId);
  }

  /**
   * Clear timeout monitoring for an enhancement
   */
  static clearTimeout(refinementId: string): void {
    const timeoutId = this.timeouts.get(refinementId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(refinementId);
      console.log('⏰ Enhancement timeout cleared for refinement:', refinementId);
    }
  }

  /**
   * Handle enhancement timeout
   */
  private static async handleTimeout(refinementId: string, chapterId: string): Promise<void> {
    try {
      console.log('🚨 Handling enhancement timeout:', { refinementId, chapterId });

      // Verify the enhancement is still in progress
      const { data: refinementData, error: fetchError } = await supabase
        .from('chapter_refinements')
        .select('refinement_status, chapter_id')
        .eq('id', refinementId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch refinement for timeout handling:', fetchError);
        return;
      }

      // Only handle timeout if still in progress and correct chapter
      if (refinementData.refinement_status === 'in_progress' && refinementData.chapter_id === chapterId) {
        // Set status to failed due to timeout
        const { error: updateError } = await supabase
          .from('chapter_refinements')
          .update({
            refinement_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', refinementId);

        if (updateError) {
          console.error('❌ Failed to update status on timeout:', updateError);
        } else {
          console.log('✅ Enhancement status set to failed due to timeout');
        }
      }

      // Clean up timeout tracking
      this.timeouts.delete(refinementId);

    } catch (error) {
      console.error('❌ Error handling enhancement timeout:', error);
    }
  }

  /**
   * Background cleanup job for abandoned enhancements
   */
  static async cleanupAbandonedEnhancements(): Promise<void> {
    try {
      console.log('🧹 Running cleanup for abandoned enhancements...');

      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - this.TIMEOUT_MINUTES);

      // Find enhancements that have been in progress too long
      const { data: abandonedEnhancements, error: fetchError } = await supabase
        .from('chapter_refinements')
        .select('id, chapter_id, updated_at')
        .eq('refinement_status', 'in_progress')
        .lt('updated_at', cutoffTime.toISOString());

      if (fetchError) {
        console.error('❌ Failed to fetch abandoned enhancements:', fetchError);
        return;
      }

      if (abandonedEnhancements && abandonedEnhancements.length > 0) {
        console.log(`🧹 Found ${abandonedEnhancements.length} abandoned enhancements`);

        // Update all abandoned enhancements to failed status
        const { error: updateError } = await supabase
          .from('chapter_refinements')
          .update({
            refinement_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .in('id', abandonedEnhancements.map(e => e.id));

        if (updateError) {
          console.error('❌ Failed to update abandoned enhancements:', updateError);
        } else {
          console.log(`✅ Cleaned up ${abandonedEnhancements.length} abandoned enhancements`);
        }
      } else {
        console.log('✅ No abandoned enhancements found');
      }

    } catch (error) {
      console.error('❌ Error during enhancement cleanup:', error);
    }
  }
}