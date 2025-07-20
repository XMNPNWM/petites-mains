
import { supabase } from '@/integrations/supabase/client';

export interface ContentVersion {
  id: string;
  chapter_id: string;
  content_type: 'creation' | 'enhancement';
  content: string;
  version_number: number;
  created_at: string;
  created_from_refinement_id?: string;
  enhancement_options?: any;
  refinement_status?: string;
  word_count?: number;
  change_summary?: string;
  user_notes?: string;
}

export interface ContentTransferResult {
  success: boolean;
  versionId?: string;
  error?: string;
}

export class ContentVersioningService {
  /**
   * Create a backup version of chapter content
   */
  static async createContentVersion(
    chapterId: string,
    contentType: 'creation' | 'enhancement',
    content: string,
    options?: {
      refinementId?: string;
      enhancementOptions?: any;
      refinementStatus?: string;
      changeSummary?: string;
      userNotes?: string;
    }
  ): Promise<string | null> {
    try {
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

      const { data, error } = await supabase
        .from('content_versions')
        .insert({
          chapter_id: chapterId,
          content_type: contentType,
          content,
          created_from_refinement_id: options?.refinementId,
          enhancement_options: options?.enhancementOptions || {},
          refinement_status: options?.refinementStatus,
          word_count: wordCount,
          change_summary: options?.changeSummary,
          user_notes: options?.userNotes
        })
        .select('id')
        .single();

      if (error) throw error;
      console.log(`✅ Created ${contentType} version for chapter ${chapterId}:`, data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating content version:', error);
      return null;
    }
  }

  /**
   * Get content version history for a chapter
   */
  static async getContentHistory(chapterId: string): Promise<ContentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('content_versions')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ContentVersion[];
    } catch (error) {
      console.error('Error fetching content history:', error);
      return [];
    }
  }

  /**
   * Import enhanced content to creation space
   */
  static async importEnhancedToCreation(
    chapterId: string,
    refinementId: string,
    enhancedContent: string,
    enhancementOptions: any
  ): Promise<ContentTransferResult> {
    try {
      // First, get current chapter content to create backup
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('content, content_version_number')
        .eq('id', chapterId)
        .single();

      if (chapterError) throw chapterError;

      // Create backup version of current creation content
      const backupVersionId = await this.createContentVersion(
        chapterId,
        'creation',
        chapter.content || '',
        {
          changeSummary: 'Backup before enhancement import',
          userNotes: 'Automatic backup created before importing enhanced content'
        }
      );

      if (!backupVersionId) {
        return { success: false, error: 'Failed to create backup version' };
      }

      // Update chapter with enhanced content
      const wordCount = enhancedContent.split(/\s+/).filter(word => word.length > 0).length;

      const { error: updateError } = await supabase
        .from('chapters')
        .update({
          content: enhancedContent,
          word_count: wordCount,
          last_enhancement_import_at: new Date().toISOString(),
          enhancement_source_refinement_id: refinementId
        })
        .eq('id', chapterId);

      if (updateError) throw updateError;

      // Create version record for the imported enhanced content
      const importVersionId = await this.createContentVersion(
        chapterId,
        'creation',
        enhancedContent,
        {
          refinementId,
          enhancementOptions,
          changeSummary: 'Enhanced content imported to creation space',
          userNotes: 'Content imported from refinement space with AI enhancements'
        }
      );

      // Update refinement with sync information
      await supabase
        .from('chapter_refinements')
        .update({
          last_creation_sync_at: new Date().toISOString(),
          creation_import_version: chapter.content_version_number + 1
        })
        .eq('id', refinementId);

      return { 
        success: true, 
        versionId: importVersionId || undefined 
      };
    } catch (error) {
      console.error('Error importing enhanced content:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Restore a specific content version
   */
  static async restoreContentVersion(versionId: string): Promise<ContentTransferResult> {
    try {
      // Get the version to restore
      const { data: version, error: versionError } = await supabase
        .from('content_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      if (version.content_type === 'creation') {
        // Get current chapter content for backup
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('content')
          .eq('id', version.chapter_id)
          .single();

        if (chapterError) throw chapterError;

        // Create backup of current content
        const backupVersionId = await this.createContentVersion(
          version.chapter_id,
          'creation',
          chapter.content || '',
          {
            changeSummary: 'Backup before version restore',
            userNotes: `Automatic backup before restoring version ${version.version_number}`
          }
        );

        if (!backupVersionId) {
          return { success: false, error: 'Failed to create backup version' };
        }

        // Restore the version content to chapter
        const wordCount = version.content.split(/\s+/).filter(word => word.length > 0).length;

        const { error: updateError } = await supabase
          .from('chapters')
          .update({
            content: version.content,
            word_count: wordCount
          })
          .eq('id', version.chapter_id);

        if (updateError) throw updateError;

        return { success: true, versionId: backupVersionId };
      } else {
        // For enhancement versions, restore to refinement and create backup of current enhanced content
        console.log('🔄 Restoring enhanced version to refinement space');
        
        // Get current refinement data to create backup
        const { data: currentRefinement, error: refinementError } = await supabase
          .from('chapter_refinements')
          .select('enhanced_content')
          .eq('chapter_id', version.chapter_id)
          .single();

        if (refinementError) throw refinementError;

        // Create backup of current enhanced content if it exists
        if (currentRefinement.enhanced_content && currentRefinement.enhanced_content.trim().length > 0) {
          await this.createContentVersion(
            version.chapter_id,
            'enhancement',
            currentRefinement.enhanced_content,
            {
              changeSummary: 'Backup before enhanced version restore',
              userNotes: `Automatic backup before restoring enhanced version ${version.version_number}`
            }
          );
        }

        // Restore the enhanced version
        const { error: updateError } = await supabase
          .from('chapter_refinements')
          .update({
            enhanced_content: version.content,
            refinement_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('chapter_id', version.chapter_id);

        if (updateError) throw updateError;

        return { success: true };
      }
    } catch (error) {
      console.error('Error restoring content version:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if creation content has changed since refinement was created
   */
  static async checkContentConflict(chapterId: string, refinementId: string): Promise<{
    hasConflict: boolean;
    creationVersion: number;
    refinementBasedOnVersion: number;
  }> {
    try {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('content_version_number')
        .eq('id', chapterId)
        .single();

      if (chapterError) throw chapterError;

      const { data: refinement, error: refinementError } = await supabase
        .from('chapter_refinements')
        .select('original_content_version')
        .eq('id', refinementId)
        .single();

      if (refinementError) throw refinementError;

      const creationVersion = chapter.content_version_number;
      const refinementBasedOnVersion = refinement.original_content_version || 1;

      return {
        hasConflict: creationVersion > refinementBasedOnVersion,
        creationVersion,
        refinementBasedOnVersion
      };
    } catch (error) {
      console.error('Error checking content conflict:', error);
      return {
        hasConflict: false,
        creationVersion: 1,
        refinementBasedOnVersion: 1
      };
    }
  }
}
