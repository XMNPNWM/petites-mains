
import { supabase } from '@/integrations/supabase/client';

export interface ContentHashWithDependencies {
  id: string;
  chapter_id: string;
  content_hash: string;
  dependencies: string[];
  affects: string[];
  last_processed: string;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export class EnhancedContentHashService {
  private static readonly ANALYSIS_VERSION = '2.0';

  static async generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async updateContentHashWithDependencies(
    chapterId: string, 
    content: string,
    dependencies: string[] = [],
    affects: string[] = []
  ): Promise<ContentHashWithDependencies> {
    const contentHash = await this.generateContentHash(content);

    console.log(`🔄 Updating content hash for chapter ${chapterId}`);

    // Try to use the existing content_hashes table structure
    try {
      // Check if hash record exists
      const { data: existingHash } = await supabase
        .from('content_hashes')
        .select('*')
        .eq('chapter_id', chapterId)
        .single();

      const hashData = {
        chapter_id: chapterId,
        original_content_hash: contentHash,
        processing_version: this.ANALYSIS_VERSION,
        last_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingHash) {
        const { data, error } = await supabase
          .from('content_hashes')
          .update(hashData)
          .eq('id', existingHash.id)
          .select()
          .single();

        if (error) throw error;
        
        // Convert to our interface format
        return {
          id: data.id,
          chapter_id: data.chapter_id,
          content_hash: data.original_content_hash,
          dependencies: dependencies, // Store locally for now
          affects: affects,
          last_processed: data.last_processed_at || new Date().toISOString(),
          analysis_version: data.processing_version || this.ANALYSIS_VERSION,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      } else {
        const { data, error } = await supabase
          .from('content_hashes')
          .insert({
            ...hashData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        // Convert to our interface format
        return {
          id: data.id,
          chapter_id: data.chapter_id,
          content_hash: data.original_content_hash,
          dependencies: dependencies,
          affects: affects,
          last_processed: data.last_processed_at || new Date().toISOString(),
          analysis_version: data.processing_version || this.ANALYSIS_VERSION,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      }
    } catch (error) {
      console.error('Error updating enhanced content hash:', error);
      throw error;
    }
  }

  static async getContentHashWithDependencies(chapterId: string): Promise<ContentHashWithDependencies | null> {
    const { data, error } = await supabase
      .from('content_hashes')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching content hash:', error);
      return null;
    }

    if (!data) return null;

    // Convert from database format to our interface
    return {
      id: data.id,
      chapter_id: data.chapter_id,
      content_hash: data.original_content_hash,
      dependencies: [], // Initialize empty for now
      affects: [],
      last_processed: data.last_processed_at || new Date().toISOString(),
      analysis_version: data.processing_version || '1.0',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static async hasContentChanged(chapterId: string, currentContent: string): Promise<boolean> {
    const existingHash = await this.getContentHashWithDependencies(chapterId);
    if (!existingHash) return true;

    const currentHash = await this.generateContentHash(currentContent);
    return existingHash.content_hash !== currentHash;
  }
}
