import { supabase } from '@/integrations/supabase/client';
import { ContentHash } from '@/types/knowledge';
import { EnhancedContentHashService } from './EnhancedContentHashService';

export class ContentHashService {
  private static readonly PROCESSING_VERSION = '1.0';

  static async generateContentHash(content: string): Promise<string> {
    return EnhancedContentHashService.generateContentHash(content);
  }

  static async generateParagraphHashes(content: string): Promise<string[]> {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const hashes = await Promise.all(
      paragraphs.map(paragraph => this.generateContentHash(paragraph.trim()))
    );
    return hashes;
  }

  static async updateContentHash(chapterId: string, content: string): Promise<ContentHash> {
    const contentHash = await this.generateContentHash(content);
    const paragraphHashes = await this.generateParagraphHashes(content);

    // Check if hash record exists in the old table
    const { data: existingHash } = await supabase
      .from('content_hashes')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();

    const hashData = {
      chapter_id: chapterId,
      original_content_hash: contentHash,
      paragraph_hashes: paragraphHashes,
      processing_version: this.PROCESSING_VERSION,
      has_changes: false,
      last_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingHash) {
      // Check for changes
      const hasChanges = existingHash.content_hash !== contentHash;
      
      const { data, error } = await supabase
        .from('content_hashes')
        .update({
          content_hash: contentHash,
          last_processed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingHash.id)
        .select()
        .single();

      if (error) throw error;
      
      // Return in the old format for backward compatibility
      return {
        id: data.id,
        chapter_id: data.chapter_id,
        original_content_hash: data.content_hash,
        enhanced_content_hash: null,
        paragraph_hashes: paragraphHashes,
        last_processed_at: data.last_processed,
        processing_version: this.PROCESSING_VERSION,
        has_changes: hasChanges,
        change_summary: hasChanges ? 'Content modified since last analysis' : undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } else {
      // Create new hash record in the enhanced table
      const enhancedHash = await EnhancedContentHashService.updateContentHashWithDependencies(
        chapterId,
        content
      );
      
      // Return in the old format for backward compatibility
      return {
        id: enhancedHash.id,
        chapter_id: enhancedHash.chapter_id,
        original_content_hash: enhancedHash.content_hash,
        enhanced_content_hash: null,
        paragraph_hashes: paragraphHashes,
        last_processed_at: enhancedHash.last_processed,
        processing_version: enhancedHash.analysis_version,
        has_changes: false,
        change_summary: undefined,
        created_at: enhancedHash.created_at,
        updated_at: enhancedHash.updated_at
      };
    }
  }

  static async verifyContentHash(chapterId: string, currentContent: string): Promise<{
    hasChanges: boolean;
    needsReanalysis: boolean;
    hashRecord?: ContentHash;
  }> {
    console.log('Verifying content hash for chapter:', chapterId);

    const hasChanged = await EnhancedContentHashService.hasContentChanged(chapterId, currentContent);
    
    if (hasChanged) {
      console.log('Content has changed, needs reanalysis');
      return {
        hasChanges: true,
        needsReanalysis: true
      };
    }

    const enhancedHash = await EnhancedContentHashService.getContentHashWithDependencies(chapterId);
    if (!enhancedHash) {
      return {
        hasChanges: true,
        needsReanalysis: true
      };
    }

    // Convert to old format for backward compatibility
    const paragraphHashes = await this.generateParagraphHashes(currentContent);
    const legacyHash: ContentHash = {
      id: enhancedHash.id,
      chapter_id: enhancedHash.chapter_id,
      original_content_hash: enhancedHash.content_hash,
      enhanced_content_hash: null,
      paragraph_hashes: paragraphHashes,
      last_processed_at: enhancedHash.last_processed,
      processing_version: enhancedHash.analysis_version,
      has_changes: false,
      change_summary: undefined,
      created_at: enhancedHash.created_at,
      updated_at: enhancedHash.updated_at
    };

    return {
      hasChanges: false,
      needsReanalysis: false,
      hashRecord: legacyHash
    };
  }

  static async markAsProcessed(chapterId: string): Promise<void> {
    await supabase
      .from('content_hashes')
      .update({
        last_processed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('chapter_id', chapterId);
  }
}
