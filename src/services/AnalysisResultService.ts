
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisResult {
  id: string;
  content_id: string;
  content_type: string;
  analysis_type: string;
  version: string;
  ai_data: any;
  confidence_score: number;
  low_confidence_flags: string[];
  is_flagged: boolean;
  last_human_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserOverride {
  id: string;
  analysis_result_id: string;
  field_path: string;
  original_ai_value: any;
  user_value: any;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
}

export class AnalysisResultService {
  static async createAnalysisResult(
    contentId: string,
    contentType: string,
    analysisType: string,
    aiData: any,
    confidenceScore: number = 0.5
  ): Promise<AnalysisResult> {
    console.log(`📊 Creating analysis result for ${contentType}:${contentId}`);

    const lowConfidenceFlags = this.identifyLowConfidenceFlags(aiData, confidenceScore);
    
    const { data, error } = await supabase
      .from('analysis_results')
      .insert({
        content_id: contentId,
        content_type: contentType,
        analysis_type: analysisType,
        version: '2.0',
        ai_data: aiData,
        confidence_score: confidenceScore,
        low_confidence_flags: lowConfidenceFlags,
        is_flagged: confidenceScore < 0.7 || lowConfidenceFlags.length > 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAnalysisResult(
    contentId: string,
    analysisType: string
  ): Promise<AnalysisResult | null> {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('content_id', contentId)
      .eq('analysis_type', analysisType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching analysis result:', error);
      return null;
    }

    return data;
  }

  static async getAnalysisWithUserOverrides(
    contentId: string,
    analysisType: string
  ): Promise<{ analysis: AnalysisResult; merged_data: any } | null> {
    const analysis = await this.getAnalysisResult(contentId, analysisType);
    if (!analysis) return null;

    // Get user overrides
    const { data: overrides } = await supabase
      .from('user_overrides')
      .select('*')
      .eq('analysis_result_id', analysis.id);

    // Merge AI data with user overrides
    let mergedData = { ...analysis.ai_data };
    
    if (overrides) {
      for (const override of overrides) {
        this.applyUserOverride(mergedData, override.field_path, override.user_value);
      }
    }

    return {
      analysis,
      merged_data: mergedData
    };
  }

  static async createUserOverride(
    analysisResultId: string,
    fieldPath: string,
    originalValue: any,
    userValue: any,
    reason?: string
  ): Promise<UserOverride> {
    console.log(`✏️ Creating user override for ${fieldPath}`);

    const { data, error } = await supabase
      .from('user_overrides')
      .insert({
        analysis_result_id: analysisResultId,
        field_path: fieldPath,
        original_ai_value: originalValue,
        user_value: userValue,
        override_reason: reason
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFlaggedAnalysis(projectId: string): Promise<AnalysisResult[]> {
    const { data, error } = await supabase
      .from('analysis_results')
      .select(`
        *,
        chapters!inner(project_id)
      `)
      .eq('is_flagged', true)
      .eq('chapters.project_id', projectId);

    if (error) throw error;
    return data || [];
  }

  private static identifyLowConfidenceFlags(aiData: any, confidenceScore: number): string[] {
    const flags: string[] = [];
    
    if (confidenceScore < 0.5) {
      flags.push('very_low_confidence');
    } else if (confidenceScore < 0.7) {
      flags.push('low_confidence');
    }

    // Check for specific patterns that indicate uncertainty
    if (aiData.characters) {
      aiData.characters.forEach((char: any, index: number) => {
        if (!char.name || char.name.includes('unclear') || char.name.includes('unknown')) {
          flags.push(`character_${index}_unclear_name`);
        }
        if (char.traits && char.traits.length === 0) {
          flags.push(`character_${index}_no_traits`);
        }
      });
    }

    return flags;
  }

  private static applyUserOverride(data: any, fieldPath: string, value: any): void {
    const paths = fieldPath.split('.');
    let current = data;
    
    for (let i = 0; i < paths.length - 1; i++) {
      const path = paths[i];
      if (!(path in current)) {
        current[path] = {};
      }
      current = current[path];
    }
    
    current[paths[paths.length - 1]] = value;
  }
}
