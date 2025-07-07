
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBase } from '@/types/knowledge';
import { PlotThread, TimelineEvent, CharacterRelationship } from '@/types/ai-brain';

export class AIBrainUpdateService {
  // Update knowledge base item
  static async updateKnowledgeItem(id: string, updates: { name?: string; description?: string }) {
    const updateData: any = { ...updates };
    
    // Set confidence to 1.0 when user edits
    updateData.confidence_score = 1.0;
    updateData.is_verified = true;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update plot thread
  static async updatePlotThread(id: string, updates: { thread_name?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('plot_threads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update timeline event
  static async updateTimelineEvent(id: string, updates: { event_name?: string; event_description?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('timeline_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update character relationship
  static async updateCharacterRelationship(id: string, updates: { character_a_name?: string; character_b_name?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('character_relationships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update plot point
  static async updatePlotPoint(id: string, updates: { name?: string; description?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence = 1.0;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('plot_points')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update chapter summary
  static async updateChapterSummary(id: string, updates: { title?: string; summary_long?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence = 1.0;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('chapter_summaries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
