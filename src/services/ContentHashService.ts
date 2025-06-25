
import { supabase } from '@/integrations/supabase/client';
import { ContentHash } from '@/types/knowledge';

export class ContentHashService {
  private static readonly PROCESSING_VERSION = '1.0';

  static async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Check if hash record exists
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
      const hasChanges = existingHash.original_content_hash !== contentHash;
      
      const { data, error } = await supabase
        .from('content_hashes')
        .update({
          ...hashData,
          has_changes: hasChanges,
          change_summary: hasChanges ? 'Content modified since last analysis' : undefined
        })
        .eq('id', existingHash.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new hash record
      const { data, error } = await supabase
        .from('content_hashes')
        .insert({
          ...hashData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async verifyContentHash(chapterId: string, currentContent: string): Promise<{
    hasChanges: boolean;
    needsReanalysis: boolean;
    hashRecord?: ContentHash;
  }> {
    console.log('Verifying content hash for chapter:', chapterId);

    try {
      const { data: hashRecord, error } = await supabase
        .from('content_hashes')
        .select('*')
        .eq('chapter_id', chapterId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!hashRecord) {
        console.log('No hash record found, needs initial analysis');
        return {
          hasChanges: true,
          needsReanalysis: true
        };
      }

      const currentHash = await this.generateContentHash(currentContent);
      const hasChanges = hashRecord.original_content_hash !== currentHash;

      console.log('Hash verification result:', {
        chapterId,
        hasChanges,
        storedHash: hashRecord.original_content_hash.substring(0, 8) + '...',
        currentHash: currentHash.substring(0, 8) + '...'
      });

      return {
        hasChanges,
        needsReanalysis: hasChanges || hashRecord.has_changes,
        hashRecord
      };
    } catch (error) {
      console.error('Hash verification failed:', error);
      return {
        hasChanges: true,
        needsReanalysis: true
      };
    }
  }

  static async markAsProcessed(chapterId: string): Promise<void> {
    await supabase
      .from('content_hashes')
      .update({
        has_changes: false,
        last_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('chapter_id', chapterId);
  }
}
