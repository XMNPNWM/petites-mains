
import { supabase } from '@/integrations/supabase/client';
import { RefinementData } from '@/types/shared';

export class RefinementService {
  static castToRefinementData(dbRefinement: any): RefinementData {
    const validStatuses = ['untouched', 'in_progress', 'completed', 'updated'];
    
    return {
      id: dbRefinement.id,
      chapter_id: dbRefinement.chapter_id,
      original_content: dbRefinement.original_content,
      enhanced_content: dbRefinement.enhanced_content,
      refinement_status: validStatuses.includes(dbRefinement.refinement_status) 
        ? dbRefinement.refinement_status 
        : 'untouched',
      ai_changes: dbRefinement.ai_changes || [],
      context_summary: dbRefinement.context_summary
    };
  }

  static async fetchRefinementData(chapterId: string): Promise<RefinementData | null> {
    try {
      const { data, error } = await supabase
        .from('chapter_refinements')
        .select('*')
        .eq('chapter_id', chapterId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return this.castToRefinementData(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching refinement data:', error);
      return null;
    }
  }

  static async createRefinementData(chapterId: string, originalContent: string): Promise<RefinementData | null> {
    try {
      const { data, error } = await supabase
        .from('chapter_refinements')
        .insert({
          chapter_id: chapterId,
          original_content: originalContent,
          enhanced_content: null, // Set to null for new refinement records
          refinement_status: 'untouched'
        })
        .select()
        .single();

      if (error) throw error;
      return this.castToRefinementData(data);
    } catch (error) {
      console.error('Error creating refinement data:', error);
      return null;
    }
  }

  static async updateOriginalContent(refinementId: string, originalContent: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chapter_refinements')
        .update({ 
          original_content: originalContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', refinementId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating original content:', error);
      return false;
    }
  }

  static async updateRefinementContent(refinementId: string, content: string, expectedChapterId?: string): Promise<void> {
    try {
      console.log('📝 RefinementService: Updating refinement content:', {
        refinementId,
        expectedChapterId,
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 100) || '[empty]'
      });

      // Validation: Verify refinement belongs to expected chapter
      if (expectedChapterId) {
        const { data: existingData, error: fetchError } = await supabase
          .from('chapter_refinements')
          .select('chapter_id, id')
          .eq('id', refinementId)
          .single();

        if (fetchError) {
          console.error('❌ RefinementService: Failed to validate refinement:', fetchError);
          throw fetchError;
        }

        if (existingData.chapter_id !== expectedChapterId) {
          const error = new Error(`Chapter ID mismatch! Expected: ${expectedChapterId}, Found: ${existingData.chapter_id}`);
          console.error('❌ RefinementService: Chapter validation failed:', error.message);
          throw error;
        }

        console.log('✅ RefinementService: Chapter validation passed');
      }

      const { data, error } = await supabase
        .from('chapter_refinements')
        .update({
          enhanced_content: content,
          refinement_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', refinementId)
        .select('id, chapter_id');

      if (error) {
        console.error('❌ RefinementService: Update failed:', error);
        throw error;
      }

      console.log('✅ RefinementService: Content updated successfully for chapter:', data?.[0]?.chapter_id);
    } catch (error) {
      console.error('❌ RefinementService: Error updating refinement content:', error);
      throw error;
    }
  }
}
