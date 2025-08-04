
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeBase } from '@/types/knowledge';
import { PlotThread, TimelineEvent, CharacterRelationship } from '@/types/ai-brain';
import { KnowledgeSynthesisService } from './KnowledgeSynthesisService';

export class AIBrainUpdateService {
  // Update knowledge base item
  static async updateKnowledgeItem(id: string, updates: { name?: string; description?: string; subcategory?: string }) {
    const updateData: any = { ...updates };
    
    // Set confidence to 1.0 when user edits
    updateData.confidence_score = 1.0;
    updateData.is_verified = true;
    updateData.user_edited = true;
    updateData.edit_timestamp = new Date().toISOString();
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('knowledge_base')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Trigger synthesis for this entity after edit
    if (data && updates.name) {
      try {
        await KnowledgeSynthesisService.synthesizeEntity(
          data.project_id, 
          data.category as 'character' | 'world_building' | 'theme', 
          updates.name
        );
        console.log(`✅ Triggered synthesis for ${updates.name} after edit`);
      } catch (synthesisError) {
        console.warn('⚠️ Synthesis trigger failed after knowledge edit:', synthesisError);
        // Don't throw - user edit succeeded, synthesis is secondary
      }
    }
    
    return data;
  }

  // Flag/unflag knowledge item
  static async toggleKnowledgeFlag(id: string, isFlagged: boolean) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ 
        is_flagged: isFlagged,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update plot thread
  static async updatePlotThread(id: string, updates: { thread_name?: string; thread_type?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.user_edited = true;
    updateData.edit_timestamp = new Date().toISOString();
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

  // Flag/unflag plot thread
  static async togglePlotThreadFlag(id: string, isFlagged: boolean) {
    const { data, error } = await supabase
      .from('plot_threads')
      .update({ 
        is_flagged: isFlagged,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update timeline event
  static async updateTimelineEvent(id: string, updates: { event_name?: string; event_description?: string; event_type?: string }) {
    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.user_edited = true;
    updateData.edit_timestamp = new Date().toISOString();
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

  // Flag/unflag timeline event
  static async toggleTimelineEventFlag(id: string, isFlagged: boolean) {
    const { data, error } = await supabase
      .from('timeline_events')
      .update({ 
        is_flagged: isFlagged,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update character relationship
  static async updateCharacterRelationship(id: string, updates: { character_a_name?: string; character_b_name?: string; relationship_type?: string }) {
    // Check for duplicate relationships if relationship_type is being updated
    if (updates.relationship_type) {
      const currentRelationship = await supabase
        .from('character_relationships')
        .select('character_a_name, character_b_name, project_id')
        .eq('id', id)
        .single();

      if (currentRelationship.error) throw currentRelationship.error;

      // Check for existing relationship with same character pair and type
      const { data: existingRelationship } = await supabase
        .from('character_relationships')
        .select('id')
        .eq('project_id', currentRelationship.data.project_id)
        .eq('character_a_name', currentRelationship.data.character_a_name)
        .eq('character_b_name', currentRelationship.data.character_b_name)
        .eq('relationship_type', updates.relationship_type)
        .neq('id', id)
        .maybeSingle();

      if (existingRelationship) {
        throw new Error('A relationship of this type already exists between these characters');
      }

      // Also check reversed character pair
      const { data: existingReversedRelationship } = await supabase
        .from('character_relationships')
        .select('id')
        .eq('project_id', currentRelationship.data.project_id)
        .eq('character_a_name', currentRelationship.data.character_b_name)
        .eq('character_b_name', currentRelationship.data.character_a_name)
        .eq('relationship_type', updates.relationship_type)
        .neq('id', id)
        .maybeSingle();

      if (existingReversedRelationship) {
        throw new Error('A relationship of this type already exists between these characters');
      }
    }

    const updateData: any = { ...updates };
    updateData.ai_confidence_new = 1.0;
    updateData.user_edited = true;
    updateData.edit_timestamp = new Date().toISOString();
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

  // Flag/unflag character relationship
  static async toggleCharacterRelationshipFlag(id: string, isFlagged: boolean) {
    const { data, error } = await supabase
      .from('character_relationships')
      .update({ 
        is_flagged: isFlagged,
        updated_at: new Date().toISOString()
      })
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

  // Flag/unflag plot point
  static async togglePlotPointFlag(id: string, isFlagged: boolean) {
    const { data, error } = await supabase
      .from('plot_points')
      .update({ 
        is_flagged: isFlagged,
        updated_at: new Date().toISOString()
      })
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

  // Flag/unflag chapter summary (Note: chapter_summaries doesn't have is_flagged field in schema)
  // This would need to be added to the database schema if needed

  // Delete methods
  static async deleteCharacterRelationship(id: string) {
    const { data, error } = await supabase
      .from('character_relationships')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePlotPoint(id: string) {
    const { data, error } = await supabase
      .from('plot_points')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePlotThread(id: string) {
    const { data, error } = await supabase
      .from('plot_threads')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTimelineEvent(id: string) {
    const { data, error } = await supabase
      .from('timeline_events')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteKnowledgeItem(id: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
