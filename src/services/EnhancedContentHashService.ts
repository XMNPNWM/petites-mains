
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

    // Check if hash record exists
    const { data: existingHash } = await supabase
      .from('content_hashes')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();

    const hashData = {
      chapter_id: chapterId,
      content_hash: contentHash,
      dependencies,
      affects,
      analysis_version: this.ANALYSIS_VERSION,
      last_processed: new Date().toISOString(),
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
      return data;
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
      return data;
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

    return data;
  }

  static async hasContentChanged(chapterId: string, currentContent: string): Promise<boolean> {
    const existingHash = await this.getContentHashWithDependencies(chapterId);
    if (!existingHash) return true;

    const currentHash = await this.generateContentHash(currentContent);
    return existingHash.content_hash !== currentHash;
  }
}
