import { supabase } from '@/integrations/supabase/client';
import { EmbeddingsService } from './EmbeddingsService';

interface MergeCandidate {
  id: string;
  embedding: number[];
  data: any;
  confidence: number;
}

interface MergeResult {
  merged: boolean;
  targetId?: string;
  reason: string;
  conflictResolution?: 'auto' | 'llm_assisted' | 'user_required';
}

/**
 * Phase 2: True embedding-based semantic merging service
 * Replaces heuristic-based matching with actual semantic similarity
 */
export class EmbeddingBasedSemanticMerger {
  
  /**
   * Merge character relationships using embeddings
   */
  static async mergeCharacterRelationships(
    projectId: string,
    newRelationship: any
  ): Promise<MergeResult> {
    try {
      console.log('🔄 Starting embedding-based relationship merging...');
      
      // Generate embedding for the new relationship
      const relationshipText = `${newRelationship.character_a_name} ${newRelationship.relationship_type} ${newRelationship.character_b_name}`;
      const embeddingResult = await EmbeddingsService.generateEmbedding(relationshipText);
      
      // Find existing relationships and their embeddings
      const { data: existingRelationships, error } = await supabase
        .from('character_relationships')
        .select('id, character_a_name, character_b_name, relationship_type, confidence_score, evidence, key_interactions, user_edited')
        .eq('project_id', projectId);
      
      if (error) {
        console.error('Error fetching existing relationships:', error);
        return { merged: false, reason: 'Error fetching existing relationships' };
      }
      
      if (!existingRelationships || existingRelationships.length === 0) {
        return { merged: false, reason: 'No existing relationships to merge with' };
      }
      
      // Calculate semantic similarity for each existing relationship
      const candidates: MergeCandidate[] = [];
      for (const rel of existingRelationships) {
        const existingText = `${rel.character_a_name} ${rel.relationship_type} ${rel.character_b_name}`;
        const existingEmbedding = await EmbeddingsService.generateEmbedding(existingText);
        
        const similarity = EmbeddingsService.calculateCosineSimilarity(
          embeddingResult.embedding,
          existingEmbedding.embedding
        );
        
        if (similarity >= 0.80) { // Semantic similarity threshold
          candidates.push({
            id: rel.id,
            embedding: existingEmbedding.embedding,
            data: rel,
            confidence: similarity
          });
        }
      }
      
      if (candidates.length === 0) {
        return { merged: false, reason: 'No semantically similar relationships found' };
      }
      
      // Sort by similarity and take the best match
      candidates.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = candidates[0];
      
      // Check for user override
      if (bestMatch.data.user_edited) {
        return {
          merged: false,
          reason: 'Target relationship has user overrides - requires manual resolution',
          conflictResolution: 'user_required'
        };
      }
      
      // Check for conflicting information
      const hasConflicts = await this.detectRelationshipConflicts(newRelationship, bestMatch.data);
      
      if (hasConflicts) {
        // Use LLM for conflict resolution
        const llmResolution = await this.resolveLLMConflict('character_relationship', newRelationship, bestMatch.data);
        if (llmResolution.requiresUserInput) {
          return {
            merged: false,
            reason: 'Conflicting information detected - requires user review',
            conflictResolution: 'user_required'
          };
        }
      }
      
      // Perform the merge
      const mergedData = await this.mergeRelationshipData(newRelationship, bestMatch.data);
      
      const { error: updateError } = await supabase
        .from('character_relationships')
        .update({
          ...mergedData,
          confidence_score: Math.max(bestMatch.data.confidence_score || 0.5, newRelationship.confidence_score || 0.5) + 0.1,
          updated_at: new Date().toISOString()
        })
        .eq('id', bestMatch.id);
      
      if (updateError) {
        console.error('Error updating merged relationship:', updateError);
        return { merged: false, reason: 'Error updating relationship' };
      }
      
      console.log(`✅ Successfully merged relationship with similarity ${(bestMatch.confidence * 100).toFixed(1)}%`);
      
      return {
        merged: true,
        targetId: bestMatch.id,
        reason: `Merged with ${(bestMatch.confidence * 100).toFixed(1)}% semantic similarity`,
        conflictResolution: hasConflicts ? 'llm_assisted' : 'auto'
      };
    } catch (error) {
      console.error('Error in embedding-based relationship merging:', error);
      return { merged: false, reason: `Error: ${error.message}` };
    }
  }
  
  /**
   * Merge timeline events using embeddings
   */
  static async mergeTimelineEvents(
    projectId: string,
    newEvent: any
  ): Promise<MergeResult> {
    try {
      console.log('🔄 Starting embedding-based timeline event merging...');
      
      // Generate embedding for the new event
      const eventText = `${newEvent.event_name || newEvent.event_summary} ${newEvent.event_type}`;
      const embeddingResult = await EmbeddingsService.generateEmbedding(eventText);
      
      // Find existing events
      const { data: existingEvents, error } = await supabase
        .from('timeline_events')
        .select('id, event_name, event_summary, event_type, confidence_score, significance, temporal_markers, user_edited')
        .eq('project_id', projectId);
      
      if (error || !existingEvents) {
        return { merged: false, reason: 'Error fetching existing timeline events' };
      }
      
      // Calculate semantic similarity
      const candidates: MergeCandidate[] = [];
      for (const event of existingEvents) {
        const existingText = `${event.event_name || event.event_summary} ${event.event_type}`;
        const existingEmbedding = await EmbeddingsService.generateEmbedding(existingText);
        
        const similarity = EmbeddingsService.calculateCosineSimilarity(
          embeddingResult.embedding,
          existingEmbedding.embedding
        );
        
        if (similarity >= 0.75) { // Slightly lower threshold for events
          candidates.push({
            id: event.id,
            embedding: existingEmbedding.embedding,
            data: event,
            confidence: similarity
          });
        }
      }
      
      if (candidates.length === 0) {
        return { merged: false, reason: 'No semantically similar events found' };
      }
      
      const bestMatch = candidates[0];
      
      if (bestMatch.data.user_edited) {
        return {
          merged: false,
          reason: 'Target event has user overrides - requires manual resolution',
          conflictResolution: 'user_required'
        };
      }
      
      // Merge timeline events into a comprehensive sequence
      const mergedData = await this.mergeTimelineEventData(newEvent, bestMatch.data);
      
      const { error: updateError } = await supabase
        .from('timeline_events')
        .update({
          ...mergedData,
          confidence_score: Math.max(bestMatch.data.confidence_score || 0.5, newEvent.confidence_score || 0.5),
          updated_at: new Date().toISOString()
        })
        .eq('id', bestMatch.id);
      
      if (updateError) {
        console.error('Error updating merged event:', updateError);
        return { merged: false, reason: 'Error updating timeline event' };
      }
      
      console.log(`✅ Successfully merged timeline event with similarity ${(bestMatch.confidence * 100).toFixed(1)}%`);
      
      return {
        merged: true,
        targetId: bestMatch.id,
        reason: `Merged with ${(bestMatch.confidence * 100).toFixed(1)}% semantic similarity`
      };
    } catch (error) {
      console.error('Error in embedding-based timeline event merging:', error);
      return { merged: false, reason: `Error: ${error.message}` };
    }
  }
  
  /**
   * Detect conflicts between relationship data
   */
  private static async detectRelationshipConflicts(newRel: any, existingRel: any): Promise<boolean> {
    // Check for fundamental conflicts
    const characterMatch = (
      (newRel.character_a_name === existingRel.character_a_name && newRel.character_b_name === existingRel.character_b_name) ||
      (newRel.character_a_name === existingRel.character_b_name && newRel.character_b_name === existingRel.character_a_name)
    );
    
    if (!characterMatch) return false;
    
    // Check for relationship type conflicts
    const typeConflict = newRel.relationship_type !== existingRel.relationship_type &&
      !this.areRelationshipTypesCompatible(newRel.relationship_type, existingRel.relationship_type);
    
    return typeConflict;
  }
  
  /**
   * Check if relationship types are compatible (e.g., "friend" and "ally")
   */
  private static areRelationshipTypesCompatible(type1: string, type2: string): boolean {
    const compatibilityGroups = [
      ['friend', 'ally', 'companion'],
      ['enemy', 'rival', 'antagonist'],
      ['mentor', 'teacher', 'guide'],
      ['family', 'relative', 'sibling', 'parent', 'child'],
      ['romantic', 'lover', 'partner']
    ];
    
    return compatibilityGroups.some(group => 
      group.includes(type1.toLowerCase()) && group.includes(type2.toLowerCase())
    );
  }
  
  /**
   * LLM-assisted conflict resolution
   */
  private static async resolveLLMConflict(
    itemType: string,
    newItem: any,
    existingItem: any
  ): Promise<{ requiresUserInput: boolean; resolution?: any }> {
    try {
      const { data: result, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: `Analyze these two ${itemType} items and determine if they can be automatically merged or if user input is required:

New Item: ${JSON.stringify(newItem, null, 2)}
Existing Item: ${JSON.stringify(existingItem, null, 2)}

Respond with JSON:
{
  "canAutoMerge": boolean,
  "reason": "explanation",
  "suggestedMerge": {...} // if canAutoMerge is true
}`,
          projectId: existingItem.project_id || 'system'
        }
      });
      
      if (error || !result?.message) {
        return { requiresUserInput: true };
      }
      
      try {
        const resolution = JSON.parse(result.message);
        return {
          requiresUserInput: !resolution.canAutoMerge,
          resolution: resolution.suggestedMerge
        };
      } catch (parseError) {
        return { requiresUserInput: true };
      }
    } catch (error) {
      console.error('Error in LLM conflict resolution:', error);
      return { requiresUserInput: true };
    }
  }
  
  /**
   * Merge relationship data intelligently
   */
  private static async mergeRelationshipData(newRel: any, existingRel: any): Promise<any> {
    return {
      evidence: [existingRel.evidence, newRel.evidence].filter(Boolean).join(' | '),
      key_interactions: [
        ...(existingRel.key_interactions || []),
        ...(newRel.key_interactions || [])
      ],
      relationship_strength: Math.max(
        existingRel.relationship_strength || 1,
        newRel.relationship_strength || 1
      )
    };
  }
  
  /**
   * Merge timeline event data into comprehensive sequence
   */
  private static async mergeTimelineEventData(newEvent: any, existingEvent: any): Promise<any> {
    return {
      event_name: `${existingEvent.event_name || existingEvent.event_summary} (séquence complète)`,
      event_summary: `${existingEvent.event_summary} - ${newEvent.event_summary}`,
      significance: [existingEvent.significance, newEvent.significance].filter(Boolean).join(' | '),
      temporal_markers: [
        ...(existingEvent.temporal_markers || []),
        ...(newEvent.temporal_markers || [])
      ],
      characters_involved_names: Array.from(new Set([
        ...(existingEvent.characters_involved_names || []),
        ...(newEvent.characters_involved_names || [])
      ]))
    };
  }
}